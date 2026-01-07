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

    // Call OpenAI for semantic analysis
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert career advisor analyzing how well a candidate's experience matches a job role.

Analyze the candidate's claims against the role requirements and categorize each match:

1. **Strong Fit** (score >= 0.7): Direct match with clear evidence. The candidate has explicitly demonstrated this skill/requirement.

2. **Loose Fit** (score 0.5-0.7): Related experience that partially addresses the requirement. The candidate has adjacent skills or experience.

3. **Stretch** (score 0.3-0.5): Transferable skills that could apply with some creativity. Requires explanation of how experience translates.

4. **Gaps**: Requirements where the candidate has no relevant experience. Include actionable suggestions.

Be generous in interpretation - look for semantic matches, not just keyword matches. For example:
- "Led product launches" matches requirements for "product management experience"
- "Managed engineering teams" matches "leadership experience"
- "Built data pipelines" can stretch to "data analysis experience"

Return your analysis as JSON with this structure:
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

Analyze how well this candidate fits the role. Be thorough and generous in finding matches.`
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
