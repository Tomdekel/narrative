import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI()

type FitAnalysisResult = {
  strong_fit: {
    requirement: string
    evidence_claims: string[]
    reasoning: string
  }[]
  loose_fit: {
    requirement: string
    partial_match: string
    reasoning: string
  }[]
  stretch: {
    requirement: string
    adjacent_experience: string
    reasoning: string
  }[]
  gaps: {
    requirement: string
    suggestion: string
  }[]
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roleIntentId } = await request.json()

    if (!roleIntentId) {
      return NextResponse.json({ error: 'Role intent ID is required' }, { status: 400 })
    }

    // Fetch role intent
    const { data: role, error: roleError } = await supabase
      .from('role_intents')
      .select('*')
      .eq('id', roleIntentId)
      .eq('user_id', user.id)
      .single()

    if (roleError || !role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Check cache - if fit_analysis exists and is recent (less than 1 hour old), return it
    if (role.fit_analysis && role.updated_at) {
      const updatedAt = new Date(role.updated_at)
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
      if (updatedAt > hourAgo) {
        return NextResponse.json({
          success: true,
          analysis: role.fit_analysis,
          cached: true,
        })
      }
    }

    // Fetch user's claims
    const { data: claims } = await supabase
      .from('claims')
      .select('id, canonical_text, claim_type, evidence_strength, confidence_score')
      .eq('user_id', user.id)
      .order('confidence_score', { ascending: false })
      .limit(50)

    if (!claims || claims.length === 0) {
      return NextResponse.json({
        success: true,
        analysis: {
          strong_fit: [],
          loose_fit: [],
          stretch: [],
          gaps: role.must_haves?.map((r: { skill: string }) => ({
            requirement: r.skill,
            suggestion: 'Add relevant experience or skills to your profile',
          })) || [],
        },
        cached: false,
      })
    }

    // Format claims for the prompt
    const claimsText = claims
      .map((c, i) => `${i + 1}. [${c.claim_type}] ${c.canonical_text}`)
      .join('\n')

    // Format requirements
    const mustHaves = role.must_haves || []
    const implicitSignals = role.implicit_signals || []

    const requirementsText = mustHaves
      .map((r: { skill: string; experience_level?: string; context?: string }, i: number) =>
        `${i + 1}. ${r.skill}${r.experience_level ? ` (${r.experience_level})` : ''}${r.context ? ` - ${r.context}` : ''}`
      )
      .join('\n')

    const signalsText = implicitSignals
      .map((s: { signal: string }, i: number) => `${i + 1}. ${s.signal}`)
      .join('\n')

    // Fetch user's career context for richer analysis
    const { data: careerContext } = await supabase
      .from('user_career_context')
      .select('career_deep_dive, guidelines_tips')
      .eq('user_id', user.id)
      .single()

    const contextText = careerContext?.career_deep_dive || ''

    // Call OpenAI for semantic analysis
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert career advisor analyzing how well a candidate's experience matches a job role.

## Critical Rules for Analysis

1. **NEVER mark common professional skills as gaps for senior candidates.** Skills like these are IMPLICIT in senior leadership roles:
   - "Ability to translate complex needs into solutions" - ANY product leader does this
   - "Strong communication skills" - demonstrated through leadership
   - "Strategic thinking" - implicit in any VP/Director/Head role
   - "Stakeholder management" - demonstrated by leading cross-functional teams
   - "Problem solving" - demonstrated by any technical/product achievement

2. **Infer skills from demonstrated experience:**
   - Led product teams → has stakeholder management, communication, strategic thinking
   - Built ML platforms → has technical architecture skills, data modeling
   - Managed cross-functional projects → has coordination, prioritization skills
   - Shipped products at scale → has execution, delivery, quality skills

3. **Be GENEROUS with matches.** If there's ANY reasonable interpretation where the candidate qualifies, count it as a match. The goal is to help candidates, not gatekeep.

## Categories

1. **Strong Fit**: Direct evidence in claims OR strongly implied by seniority/experience
2. **Loose Fit**: Related experience that demonstrates the underlying competency
3. **Stretch**: Transferable skills from adjacent domains
4. **Gaps**: ONLY for truly missing hard requirements (specific certifications, specific tech stacks, specific industry experience) - NOT for soft skills or competencies a senior person would have

## Examples

- Requirement: "Translate complex technical requirements into user-friendly solutions"
  - If candidate "Led product for ML platform" → Strong Fit (product leaders do this daily)
  - NOT a gap unless candidate has never done product work

- Requirement: "5+ years experience in B2B SaaS"
  - If candidate worked at B2B companies → Strong Fit
  - If candidate worked at B2C but built enterprise features → Loose Fit

Return your analysis as JSON:
{
  "strong_fit": [{"requirement": string, "evidence_claims": string[], "reasoning": string}],
  "loose_fit": [{"requirement": string, "partial_match": string, "reasoning": string}],
  "stretch": [{"requirement": string, "adjacent_experience": string, "reasoning": string}],
  "gaps": [{"requirement": string, "suggestion": string}]
}`
        },
        {
          role: 'user',
          content: `# Role Details
Title: ${role.title_raw}
Level: ${role.level_inferred}
Domain: ${role.domain}
Function: ${role.function_inferred}

# Key Requirements
${requirementsText || 'None specified'}

# Implicit Signals
${signalsText || 'None identified'}

# Candidate's Experience (Claims)
${claimsText}
${contextText ? `\n# Additional Career Context\n${contextText}` : ''}

Analyze how well this candidate fits the role. Be thorough and GENEROUS in finding matches. Remember: common professional skills are NOT gaps for senior candidates.`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const analysisContent = response.choices[0]?.message?.content
    if (!analysisContent) {
      throw new Error('No analysis returned from OpenAI')
    }

    const analysis: FitAnalysisResult = JSON.parse(analysisContent)

    // Cache the result
    await supabase
      .from('role_intents')
      .update({
        fit_analysis: analysis,
        updated_at: new Date().toISOString(),
      })
      .eq('id', roleIntentId)

    return NextResponse.json({
      success: true,
      analysis,
      cached: false,
    })
  } catch (error) {
    console.error('Fit analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze fit' },
      { status: 500 }
    )
  }
}
