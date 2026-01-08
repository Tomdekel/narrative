import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import type { StrategicAssessment } from '@/server/services/resume-pipeline/types'
import {
  STRATEGIC_ASSESSMENT_SYSTEM_PROMPT,
  STRATEGIC_ASSESSMENT_USER_PROMPT,
} from '@/lib/openai/prompts/strategic-assessment'

const openai = new OpenAI()

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roleId, forceRefresh } = await request.json()

    if (!roleId) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 })
    }

    // Fetch role intent with JD text
    const { data: role, error: roleError } = await supabase
      .from('role_intents')
      .select('*')
      .eq('id', roleId)
      .eq('user_id', user.id)
      .single()

    if (roleError || !role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Check cache - if strategic_assessment exists and not forcing refresh
    if (role.strategic_assessment && !forceRefresh) {
      return NextResponse.json({
        success: true,
        assessment: role.strategic_assessment as StrategicAssessment,
        cached: true,
      })
    }

    // Fetch user's CV artifact
    const { data: cvArtifact } = await supabase
      .from('artifacts')
      .select('extracted_text')
      .eq('user_id', user.id)
      .eq('is_cv', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!cvArtifact?.extracted_text) {
      return NextResponse.json(
        { error: 'No CV found. Please upload your CV first.' },
        { status: 400 }
      )
    }

    // Fetch user's claims
    const { data: claims } = await supabase
      .from('claims')
      .select('id, canonical_text, claim_type, evidence_strength, confidence_score')
      .eq('user_id', user.id)
      .order('confidence_score', { ascending: false })
      .limit(50)

    // Fetch user's career context
    const { data: careerContext } = await supabase
      .from('user_career_context')
      .select('career_deep_dive')
      .eq('user_id', user.id)
      .single()

    // Format claims for prompt
    const claimsText = claims?.length
      ? claims
          .map(
            (c, i) =>
              `${i + 1}. [${c.claim_type}/${c.evidence_strength}] ${c.canonical_text}`
          )
          .join('\n')
      : 'No claims extracted yet'

    // Build the JD text - prefer raw JD, fall back to structured data
    let jobDescriptionText = role.jd_raw || ''
    if (!jobDescriptionText && role.must_haves) {
      // Reconstruct from structured data
      const mustHaves = role.must_haves
        .map((r: { skill: string; experience_level?: string }) =>
          `- ${r.skill}${r.experience_level ? ` (${r.experience_level})` : ''}`
        )
        .join('\n')
      const niceToHaves = role.nice_to_haves
        ?.map((r: { skill: string }) => `- ${r.skill}`)
        .join('\n')
      const implicitSignals = role.implicit_signals
        ?.map((s: { signal: string }) => `- ${s.signal}`)
        .join('\n')

      jobDescriptionText = `
Role: ${role.title_raw}
${role.company_raw ? `Company: ${role.company_raw}` : ''}
${role.level_inferred ? `Level: ${role.level_inferred}` : ''}
${role.domain ? `Domain: ${role.domain}` : ''}

Must-Have Requirements:
${mustHaves || 'Not specified'}

${niceToHaves ? `Nice-to-Have:\n${niceToHaves}` : ''}

${implicitSignals ? `Implicit Signals:\n${implicitSignals}` : ''}
`.trim()
    }

    // Call OpenAI for strategic assessment
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: STRATEGIC_ASSESSMENT_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: STRATEGIC_ASSESSMENT_USER_PROMPT({
            jobDescription: jobDescriptionText,
            roleTitle: role.title_raw,
            company: role.company_raw,
            cvText: cvArtifact.extracted_text,
            claims: claimsText,
            careerContext: careerContext?.career_deep_dive || null,
          }),
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5, // Slightly creative for nuanced analysis
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    const assessment: StrategicAssessment = JSON.parse(content)

    // Cache the result
    await supabase
      .from('role_intents')
      .update({
        strategic_assessment: assessment,
        updated_at: new Date().toISOString(),
      })
      .eq('id', roleId)

    return NextResponse.json({
      success: true,
      assessment,
      cached: false,
    })
  } catch (error) {
    console.error('Strategic assessment error:', error)
    return NextResponse.json(
      { error: 'Failed to generate strategic assessment' },
      { status: 500 }
    )
  }
}
