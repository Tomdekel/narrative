import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateResume } from '@/lib/openai/client'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { roleId, claimIds, config } = await request.json()

    if (!roleId || !claimIds?.length) {
      return NextResponse.json(
        { error: 'Missing roleId or claimIds' },
        { status: 400 }
      )
    }

    // Fetch role
    const { data: role, error: roleError } = await supabase
      .from('role_intents')
      .select('title_raw, must_haves, nice_to_haves')
      .eq('id', roleId)
      .eq('user_id', user.id)
      .single()

    if (roleError || !role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Fetch selected claims
    const { data: claims, error: claimsError } = await supabase
      .from('claims')
      .select(`
        id,
        canonical_text,
        claim_type,
        evidence_strength,
        metrics (
          value,
          unit,
          context
        )
      `)
      .in('id', claimIds)
      .eq('user_id', user.id)

    if (claimsError || !claims?.length) {
      return NextResponse.json({ error: 'Claims not found' }, { status: 404 })
    }

    // Filter claims based on risk posture
    let filteredClaims = claims
    if (config.risk_posture === 'safe') {
      filteredClaims = claims.filter(c => c.evidence_strength === 'strong')
    } else if (config.risk_posture === 'balanced') {
      filteredClaims = claims.filter(c =>
        c.evidence_strength === 'strong' || c.evidence_strength === 'medium'
      )
    }

    // Prepare claims for generation
    const claimsForGeneration = filteredClaims.map(claim => ({
      text: claim.canonical_text,
      type: claim.claim_type,
      evidence_strength: claim.evidence_strength,
      metrics: claim.metrics?.map((m: { value: string; unit: string; context: string }) =>
        `${m.value}${m.unit ? ' ' + m.unit : ''} ${m.context || ''}`.trim()
      ).filter(Boolean),
    }))

    // Extract requirements from role
    const mustHaves = (role.must_haves || []) as { skill: string }[]
    const niceToHaves = (role.nice_to_haves || []) as { skill: string }[]
    const roleRequirements = [
      ...mustHaves.map(r => r.skill),
      ...niceToHaves.map(r => r.skill),
    ]

    // Generate resume
    const generated = await generateResume({
      claims: claimsForGeneration,
      roleTitle: role.title_raw,
      roleRequirements,
      config: {
        risk_posture: config.risk_posture || 'balanced',
        tone: config.tone || 'professional',
        max_bullets: config.max_bullets || 8,
      },
    })

    return NextResponse.json(generated)
  } catch (error) {
    console.error('Resume generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate resume' },
      { status: 500 }
    )
  }
}
