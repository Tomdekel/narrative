import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI()

type GeneratedResume = {
  professional_summary: string
  experience_bullets: { text: string; impact_level: string }[]
  skills_highlighted: string[]
  tailoring_notes: string
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
    const { roleId, currentResume, revisionRequest } = await request.json()

    if (!roleId || !currentResume || !revisionRequest) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Fetch role for context
    const { data: role, error: roleError } = await supabase
      .from('role_intents')
      .select('title_raw, company_raw, level_inferred, domain')
      .eq('id', roleId)
      .eq('user_id', user.id)
      .single()

    if (roleError || !role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Fetch user claims for reference
    const { data: claims } = await supabase
      .from('claims')
      .select('canonical_text, claim_type')
      .eq('user_id', user.id)
      .order('confidence_score', { ascending: false })
      .limit(50)

    const claimsText = (claims || [])
      .map((c, i) => `${i + 1}. [${c.claim_type}] ${c.canonical_text}`)
      .join('\n')

    const systemPrompt = `You are an expert resume editor helping refine generated resume content.

## Your Role
Apply the user's revision request to improve the resume. You must:
1. ONLY use information from the provided claims - never fabricate new achievements
2. Keep changes focused on the specific revision request
3. Maintain the overall structure and quality of the resume
4. Preserve any elements the user hasn't asked to change

## Important Rules
- If asked to add content, only add from the available claims
- If asked to remove content, do so cleanly
- If asked to rephrase, keep the factual content accurate
- Never invent metrics or achievements not in the claims

Return JSON with the same structure as the input:
{
  "professional_summary": "string",
  "experience_bullets": [{"text": "string", "impact_level": "high|medium|low"}],
  "skills_highlighted": ["string"],
  "tailoring_notes": "string"
}`

    const userPrompt = `Apply this revision to the resume:

# REVISION REQUEST
"${revisionRequest}"

# CURRENT RESUME
Professional Summary:
${currentResume.professional_summary}

Experience Bullets:
${currentResume.experience_bullets.map((b: { text: string }) => `- ${b.text}`).join('\n')}

Skills:
${currentResume.skills_highlighted.join(', ')}

# TARGET ROLE
${role.title_raw} at ${role.company_raw || 'Company'}
Level: ${role.level_inferred}
Domain: ${role.domain}

# AVAILABLE CLAIMS (for adding content)
${claimsText || 'No claims available'}

Apply the revision request and return the updated resume content.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content in OpenAI response')
    }

    const revised = JSON.parse(content)

    return NextResponse.json(revised)
  } catch (error) {
    console.error('Resume revision error:', error)
    return NextResponse.json(
      { error: 'Failed to revise resume' },
      { status: 500 }
    )
  }
}
