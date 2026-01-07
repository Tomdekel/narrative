import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTailoredResume, type GeneratedResume } from '@/server/services/resume-pipeline'

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

    // Fetch role intent
    const { data: role, error: roleError } = await supabase
      .from('role_intents')
      .select('*')
      .eq('id', roleId)
      .eq('user_id', user.id)
      .single()

    if (roleError || !role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Fetch user's CV (the is_cv artifact)
    const { data: cvArtifact } = await supabase
      .from('artifacts')
      .select('extracted_text')
      .eq('user_id', user.id)
      .eq('is_cv', true)
      .single()

    // If no CV marked, try to get the first PDF artifact
    let cvText = cvArtifact?.extracted_text
    if (!cvText) {
      const { data: firstArtifact } = await supabase
        .from('artifacts')
        .select('extracted_text')
        .eq('user_id', user.id)
        .eq('file_type', 'application/pdf')
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      cvText = firstArtifact?.extracted_text
    }

    if (!cvText) {
      return NextResponse.json(
        { error: 'No CV found. Please upload your CV first.' },
        { status: 400 }
      )
    }

    // Fetch all user claims
    const { data: claims } = await supabase
      .from('claims')
      .select('id, canonical_text, claim_type, evidence_strength, confidence_score')
      .eq('user_id', user.id)
      .order('confidence_score', { ascending: false })
      .limit(100)

    if (!claims || claims.length === 0) {
      return NextResponse.json(
        { error: 'No career insights found. Please upload documents to extract insights.' },
        { status: 400 }
      )
    }

    // Fetch career context and guidelines
    const { data: careerContext } = await supabase
      .from('user_career_context')
      .select('career_deep_dive, guidelines_tips')
      .eq('user_id', user.id)
      .single()

    // Run the pipeline
    const result = await generateTailoredResume({
      cvText,
      claims,
      targetRole: {
        id: role.id,
        title_raw: role.title_raw,
        company_raw: role.company_raw,
        level_inferred: role.level_inferred,
        function_inferred: role.function_inferred,
        domain: role.domain,
        must_haves: role.must_haves,
        nice_to_haves: role.nice_to_haves,
        implicit_signals: role.implicit_signals,
        fit_analysis: role.fit_analysis,
        user_corrections: role.user_corrections,
      },
      careerContext: careerContext?.career_deep_dive || undefined,
      guidelines: careerContext?.guidelines_tips || undefined,
    })

    return NextResponse.json({
      success: true,
      resume: result.resume,
      // Include intermediate results for debugging/transparency
      debug: {
        cvStructure: {
          experienceCount: result.intermediate.cvStructure.experience.length,
          educationCount: result.intermediate.cvStructure.education.length,
        },
        claimsAttributed: Object.keys(result.intermediate.attributedClaims).length,
        narrativeAngle: result.intermediate.roleAnalysis.narrative_angle,
      }
    })
  } catch (error) {
    console.error('Resume generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate resume' },
      { status: 500 }
    )
  }
}

// Type export for frontend
export type { GeneratedResume }
