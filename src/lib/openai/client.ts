import OpenAI from 'openai'
import {
  CLAIM_EXTRACTION_SYSTEM_PROMPT,
  CLAIM_EXTRACTION_USER_PROMPT,
} from './prompts/claim-extraction'
import {
  CLAIM_EXTRACTION_JSON_SCHEMA,
  ClaimExtractionResponse,
  ClaimExtractionResponseSchema,
} from './schemas/claim-extraction'
import {
  ROLE_INTENT_SYSTEM_PROMPT,
  ROLE_INTENT_USER_PROMPT,
} from './prompts/role-intent'
import {
  ROLE_INTENT_JSON_SCHEMA,
  RoleIntentExtraction,
  RoleIntentExtractionSchema,
} from './schemas/role-intent'
import {
  RESUME_GENERATION_SYSTEM_PROMPT,
  RESUME_GENERATION_USER_PROMPT,
} from './prompts/resume-generation'
import {
  RESUME_GENERATION_JSON_SCHEMA,
  ResumeGeneration,
  ResumeGenerationSchema,
} from './schemas/resume-generation'

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set. AI features will not work.')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding
}

export async function extractClaims(
  text: string,
  documentType: string = 'document'
): Promise<ClaimExtractionResponse> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-2024-08-06',
    messages: [
      { role: 'system', content: CLAIM_EXTRACTION_SYSTEM_PROMPT },
      { role: 'user', content: CLAIM_EXTRACTION_USER_PROMPT(text, documentType) },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: CLAIM_EXTRACTION_JSON_SCHEMA,
    },
    temperature: 0.3, // Lower temperature for more consistent extraction
  })

  const content = response.choices[0].message.content
  if (!content) {
    throw new Error('No content in OpenAI response')
  }

  const parsed = JSON.parse(content)

  // Validate with Zod schema
  return ClaimExtractionResponseSchema.parse(parsed)
}

export async function parseRoleIntent(
  jobDescription: string
): Promise<RoleIntentExtraction> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-2024-08-06',
    messages: [
      { role: 'system', content: ROLE_INTENT_SYSTEM_PROMPT },
      { role: 'user', content: ROLE_INTENT_USER_PROMPT(jobDescription) },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: ROLE_INTENT_JSON_SCHEMA,
    },
    temperature: 0.3,
  })

  const content = response.choices[0].message.content
  if (!content) {
    throw new Error('No content in OpenAI response')
  }

  const parsed = JSON.parse(content)

  // Validate with Zod schema
  return RoleIntentExtractionSchema.parse(parsed)
}

export async function generateResume(params: {
  claims: { text: string; type: string; evidence_strength: string; metrics?: string[] }[]
  roleTitle: string
  roleRequirements: string[]
  config: {
    risk_posture: 'safe' | 'balanced' | 'bold'
    tone: 'professional' | 'conversational' | 'technical'
    max_bullets: number
  }
}): Promise<ResumeGeneration> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-2024-08-06',
    messages: [
      { role: 'system', content: RESUME_GENERATION_SYSTEM_PROMPT },
      { role: 'user', content: RESUME_GENERATION_USER_PROMPT(params) },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: RESUME_GENERATION_JSON_SCHEMA,
    },
    temperature: 0.7, // Slightly higher for more creative writing
  })

  const content = response.choices[0].message.content
  if (!content) {
    throw new Error('No content in OpenAI response')
  }

  const parsed = JSON.parse(content)

  // Validate with Zod schema
  return ResumeGenerationSchema.parse(parsed)
}
