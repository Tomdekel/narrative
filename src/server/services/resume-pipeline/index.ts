// Resume Generation Pipeline
// Multi-step process for generating tailored, structured CVs

import { parseCVStructure } from './step1-parse-cv'
import { attributeClaimsToJobs } from './step2-attribute-claims'
import { analyzeRoleAndNarrative } from './step3-analyze-role'
import { composeResume } from './step4-compose'
import type {
  PipelineInput,
  GeneratedResume,
  CVStructure,
  AttributedClaims,
  RoleAnalysis
} from './types'

export type {
  GeneratedResume,
  CVStructure,
  AttributedClaims,
  RoleAnalysis,
  PipelineInput
} from './types'

export type PipelineResult = {
  resume: GeneratedResume
  intermediate: {
    cvStructure: CVStructure
    attributedClaims: AttributedClaims
    roleAnalysis: RoleAnalysis
  }
}

/**
 * Generate a tailored resume using a multi-step pipeline:
 * 1. Parse CV structure (GPT-4o-mini)
 * 2. Attribute claims to jobs (GPT-4o-mini)
 * 3. Analyze role and determine narrative (GPT-4o)
 * 4. Compose final CV (GPT-4o)
 */
export async function generateTailoredResume(
  input: PipelineInput
): Promise<PipelineResult> {
  const { cvText, claims, targetRole, careerContext, guidelines } = input

  // Step 1: Parse CV structure
  console.log('[Pipeline] Step 1: Parsing CV structure...')
  const cvStructure = await parseCVStructure(cvText)
  console.log(`[Pipeline] Parsed ${cvStructure.experience.length} jobs, ${cvStructure.education.length} education entries`)

  // Step 2: Attribute claims to jobs
  console.log('[Pipeline] Step 2: Attributing claims to jobs...')
  const attributedClaims = await attributeClaimsToJobs(claims, cvStructure.experience)
  const totalAttributed = Object.values(attributedClaims).flat().length
  console.log(`[Pipeline] Attributed ${totalAttributed}/${claims.length} claims`)

  // Step 3: Analyze role and determine narrative
  console.log('[Pipeline] Step 3: Analyzing role and narrative...')
  const roleAnalysis = await analyzeRoleAndNarrative({
    targetRole,
    cvStructure,
    claims,
    careerContext
  })
  console.log(`[Pipeline] Narrative: ${roleAnalysis.narrative_angle}`)

  // Step 4: Compose final CV
  console.log('[Pipeline] Step 4: Composing final CV...')
  const resume = await composeResume({
    cvStructure,
    claims,
    attributedClaims,
    roleAnalysis,
    targetRole,
    guidelines
  })
  console.log('[Pipeline] CV composition complete')

  return {
    resume,
    intermediate: {
      cvStructure,
      attributedClaims,
      roleAnalysis
    }
  }
}

// Re-export individual steps for testing/debugging
export { parseCVStructure } from './step1-parse-cv'
export { attributeClaimsToJobs } from './step2-attribute-claims'
export { analyzeRoleAndNarrative } from './step3-analyze-role'
export { composeResume } from './step4-compose'
