// Step 2: Attribute claims to specific jobs
// Uses GPT-4o-mini for speed - pattern matching task

import OpenAI from 'openai'
import type { Claim, ParsedExperience, AttributedClaims } from './types'

const openai = new OpenAI()

export async function attributeClaimsToJobs(
  claims: Claim[],
  experience: ParsedExperience[]
): Promise<AttributedClaims> {
  if (experience.length === 0 || claims.length === 0) {
    return {}
  }

  // Format jobs for the prompt
  const jobsList = experience
    .map((job, i) => `${job.id}: ${job.company} - ${job.title} (${job.start_date} to ${job.end_date})`)
    .join('\n')

  // Format claims for the prompt
  const claimsList = claims
    .map((c, i) => `${i + 1}. [${c.claim_type}] ${c.canonical_text}`)
    .join('\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are matching career achievements to jobs. For each claim, identify which job it most likely belongs to based on:
- Company/product names mentioned
- Timeline references
- Technology or domain hints
- Type of responsibility (startup founder vs. enterprise PM, etc.)

Rules:
1. Each claim should be attributed to ONE job (the most relevant)
2. If a claim doesn't clearly belong to any job (e.g., general skills), assign it to "general"
3. When in doubt, use context clues - startup terminology likely goes with startup roles, etc.

Return JSON mapping job IDs to arrays of claim numbers:
{
  "exp_1": [1, 5, 8],
  "exp_2": [2, 3],
  "general": [4, 6]
}`
      },
      {
        role: 'user',
        content: `## JOBS
${jobsList}

## CLAIMS
${claimsList}

Match each claim number to the appropriate job ID.`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No content returned from claim attribution')
  }

  const attribution = JSON.parse(content) as Record<string, number[]>

  // Convert claim numbers to claim IDs
  const result: AttributedClaims = {}
  for (const [jobId, claimNumbers] of Object.entries(attribution)) {
    result[jobId] = claimNumbers
      .filter(n => n >= 1 && n <= claims.length)
      .map(n => claims[n - 1].id)
  }

  return result
}
