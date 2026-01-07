import { createClient } from '@supabase/supabase-js'
import { extractClaims, generateEmbedding } from '@/lib/openai/client'
import { ExtractedClaim } from '@/lib/openai/schemas/claim-extraction'

// Create admin client for server-side operations
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export async function processClaimExtraction(jobId: string, payload: {
  artifact_id: string
  user_id: string
}) {
  const supabase = createAdminClient()
  const { artifact_id, user_id } = payload

  try {
    // Update job status
    await supabase
      .from('processing_jobs')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', jobId)

    // Get the artifact with extracted text
    const { data: artifact, error: artifactError } = await supabase
      .from('artifacts')
      .select('extracted_text, file_type, file_name')
      .eq('id', artifact_id)
      .single()

    if (artifactError || !artifact?.extracted_text) {
      throw new Error('Artifact not found or text not extracted')
    }

    // Determine document type from file name
    const fileName = artifact.file_name?.toLowerCase() || ''
    let documentType = 'career document'
    if (fileName.includes('cv') || fileName.includes('resume')) {
      documentType = 'CV/Resume'
    } else if (fileName.includes('prd') || fileName.includes('spec')) {
      documentType = 'Product Requirements Document'
    } else if (fileName.includes('review') || fileName.includes('performance')) {
      documentType = 'Performance Review'
    }

    // Extract claims using GPT-4o
    const extractionResult = await extractClaims(artifact.extracted_text, documentType)

    // Save claims to database
    const savedClaims = []
    for (const claim of extractionResult.claims) {
      // Generate embedding for the claim
      let embedding = null
      try {
        embedding = await generateEmbedding(claim.canonical_text)
      } catch (e) {
        console.warn('Failed to generate claim embedding:', e)
      }

      // Insert claim
      const { data: savedClaim, error: claimError } = await supabase
        .from('claims')
        .insert({
          user_id,
          claim_type: claim.claim_type,
          canonical_text: claim.canonical_text,
          variants: [], // Will be populated later
          truth_status: 'unverified',
          evidence_strength: getEvidenceStrength(claim.confidence_score),
          confidence_score: claim.confidence_score,
          risk_flags: claim.risk_flags || [],
          embedding,
        })
        .select('id')
        .single()

      if (claimError) {
        console.error('Failed to save claim:', claimError)
        continue
      }

      savedClaims.push({ ...savedClaim, claim })

      // Link claim to artifact evidence
      await supabase.from('claim_support').insert({
        claim_id: savedClaim.id,
        evidence_type: 'artifact_snippet',
        source_text: claim.source_text,
        artifact_id,
      })

      // Save metrics if present
      if (claim.metrics && claim.metrics.length > 0) {
        for (const metric of claim.metrics) {
          await supabase.from('metrics').insert({
            claim_id: savedClaim.id,
            metric_type: metric.context,
            value_numeric: parseFloat(metric.value) || null,
            unit: metric.unit,
            context: metric.context,
          })
        }
      }

      // Link skills if present
      if (claim.skills && claim.skills.length > 0) {
        for (const skillName of claim.skills) {
          // Find or create skill
          let { data: skill } = await supabase
            .from('skills')
            .select('id')
            .eq('name', skillName)
            .single()

          if (!skill) {
            const { data: newSkill } = await supabase
              .from('skills')
              .insert({ name: skillName, category: 'extracted' })
              .select('id')
              .single()
            skill = newSkill
          }

          if (skill) {
            await supabase.from('claim_skill').insert({
              claim_id: savedClaim.id,
              skill_id: skill.id,
              proficiency_demonstrated: 'mentioned',
            })
          }
        }
      }
    }

    // Update artifact as ready with extraction summary
    await supabase
      .from('artifacts')
      .update({
        status: 'ready',
        processed_at: new Date().toISOString(),
        processing_metadata: {
          claims_extracted: savedClaims.length,
          document_summary: extractionResult.document_summary,
          extraction_notes: extractionResult.extraction_notes,
        },
      })
      .eq('id', artifact_id)

    // Mark job as completed
    await supabase
      .from('processing_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result: {
          claims_extracted: savedClaims.length,
          document_summary: extractionResult.document_summary,
        },
      })
      .eq('id', jobId)

    return { success: true, claims_extracted: savedClaims.length }
  } catch (error) {
    console.error('Claim extraction error:', error)

    // Mark job as failed
    await supabase
      .from('processing_jobs')
      .update({
        status: 'failed',
        last_error: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    return { success: false, error }
  }
}

function getEvidenceStrength(confidenceScore: number): string {
  if (confidenceScore >= 0.8) return 'strong'
  if (confidenceScore >= 0.5) return 'medium'
  return 'weak'
}
