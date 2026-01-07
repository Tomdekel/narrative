import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI()

type FitAnalysis = {
  strong_fit: { requirement: string; evidence_claims: string[]; reasoning: string }[]
  loose_fit: { requirement: string; partial_match: string; reasoning: string }[]
  stretch: { requirement: string; adjacent_experience: string; reasoning: string }[]
  gaps: { requirement: string; suggestion: string }[]
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { roleId } = await request.json()

    if (!roleId) {
      return NextResponse.json({ error: 'Missing roleId' }, { status: 400 })
    }

    // Fetch role with fit analysis and corrections
    const { data: role, error: roleError } = await supabase
      .from('role_intents')
      .select('*')
      .eq('id', roleId)
      .eq('user_id', user.id)
      .single()

    if (roleError || !role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Fetch ALL user claims (sorted by confidence)
    const { data: claims, error: claimsError } = await supabase
      .from('claims')
      .select(`
        id,
        canonical_text,
        claim_type,
        evidence_strength,
        confidence_score,
        metrics (
          value,
          unit,
          context
        )
      `)
      .eq('user_id', user.id)
      .order('confidence_score', { ascending: false })
      .limit(100)

    if (claimsError) {
      console.error('Error fetching claims:', claimsError)
    }

    // Fetch career context and guidelines
    const { data: careerContext } = await supabase
      .from('user_career_context')
      .select('career_deep_dive, guidelines_tips')
      .eq('user_id', user.id)
      .single()

    // Prepare claims for the prompt
    const claimsText = (claims || [])
      .map((c, i) => {
        const metrics = c.metrics?.map((m: { value: string; unit: string; context: string }) =>
          `${m.value}${m.unit ? ' ' + m.unit : ''} ${m.context || ''}`.trim()
        ).filter(Boolean)
        return `${i + 1}. [${c.claim_type}] ${c.canonical_text}${metrics?.length ? ` (Metrics: ${metrics.join(', ')})` : ''}`
      })
      .join('\n')

    // Extract requirements
    const mustHaves = (role.must_haves || []) as { skill: string; experience_level?: string }[]
    const implicitSignals = (role.implicit_signals || []) as { signal: string }[]

    const requirementsText = mustHaves
      .map((r, i) => `${i + 1}. ${r.skill}${r.experience_level ? ` (${r.experience_level})` : ''}`)
      .join('\n')

    const signalsText = implicitSignals
      .map((s, i) => `${i + 1}. ${s.signal}`)
      .join('\n')

    // Format fit analysis
    const fitAnalysis = role.fit_analysis as FitAnalysis | null
    let fitAnalysisText = ''
    if (fitAnalysis) {
      const strong = fitAnalysis.strong_fit?.map(f => `- STRONG: ${f.requirement} → ${f.reasoning}`).join('\n') || ''
      const loose = fitAnalysis.loose_fit?.map(f => `- PARTIAL: ${f.requirement} → ${f.reasoning}`).join('\n') || ''
      const stretch = fitAnalysis.stretch?.map(f => `- STRETCH: ${f.requirement} → ${f.reasoning}`).join('\n') || ''
      const gaps = fitAnalysis.gaps?.map(f => `- GAP: ${f.requirement}`).join('\n') || ''
      fitAnalysisText = [strong, loose, stretch, gaps].filter(Boolean).join('\n')
    }

    // Build the comprehensive prompt
    const systemPrompt = `You are an expert resume writer who creates compelling, truthful resumes tailored to specific roles.

## Your Mission
Generate resume content that showcases the candidate's fit for this specific role. You must:
1. ONLY use information from the provided claims - never fabricate
2. Prioritize claims that match the role's requirements
3. Reframe claims to highlight relevance to this specific role
4. Use strong action verbs and quantify achievements
5. Match the tone and terminology of the target role/industry

## Output Sections
1. **Professional Summary**: 2-3 impactful sentences positioning the candidate for this specific role
2. **Experience Bullets**: 6-10 achievement-focused bullet points (prioritize role-relevant claims)
3. **Key Skills**: Skills most relevant to this role
4. **Tailoring Notes**: Brief explanation of how this resume is optimized for the role

## Writing Guidelines
- Start bullets with action verbs (Led, Built, Drove, Designed, etc.)
- Include specific metrics where available
- Keep bullets to 1-2 lines
- Prioritize achievements over responsibilities
- For stretches/gaps: frame adjacent experience positively, don't apologize

Return JSON with this exact structure:
{
  "professional_summary": "string",
  "experience_bullets": [{"text": "string", "impact_level": "high|medium|low"}],
  "skills_highlighted": ["string"],
  "tailoring_notes": "string"
}`

    const userPrompt = `Generate a tailored resume for this role:

# TARGET ROLE
Title: ${role.title_raw}
Company: ${role.company_raw || 'Not specified'}
Level: ${role.level_inferred}
Domain: ${role.domain}
Function: ${role.function_inferred}

# KEY REQUIREMENTS
${requirementsText || 'None specified'}

# IMPLICIT SIGNALS (what they're really looking for)
${signalsText || 'None identified'}

# FIT ANALYSIS (how candidate matches)
${fitAnalysisText || 'No analysis available'}

${role.user_corrections ? `# USER CORRECTIONS (important context from candidate)
${role.user_corrections}` : ''}

# CANDIDATE'S EXPERIENCE (verified claims)
${claimsText || 'No claims available'}

${careerContext?.career_deep_dive ? `# CAREER CONTEXT
${careerContext.career_deep_dive}` : ''}

${careerContext?.guidelines_tips ? `# CV WRITING PREFERENCES
${careerContext.guidelines_tips}` : ''}

Generate the most compelling, tailored resume content for this specific role.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content in OpenAI response')
    }

    const generated = JSON.parse(content)

    return NextResponse.json(generated)
  } catch (error) {
    console.error('Resume generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate resume' },
      { status: 500 }
    )
  }
}
