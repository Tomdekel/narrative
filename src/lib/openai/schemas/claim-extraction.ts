import { z } from 'zod'

// Zod schema for validation
export const MetricSchema = z.object({
  value: z.string().describe('The numeric value or percentage'),
  unit: z.string().describe('The unit of measurement (%, users, $, etc.)'),
  context: z.string().describe('What the metric measures'),
})

export const ExtractedClaimSchema = z.object({
  claim_type: z.enum(['achievement', 'responsibility', 'skill', 'credential', 'context'])
    .describe('The type of career claim'),
  canonical_text: z.string()
    .describe('Clean, professional version of the claim'),
  source_text: z.string()
    .describe('Original text snippet that supports this claim'),
  metrics: z.array(MetricSchema).optional()
    .describe('Any quantifiable metrics mentioned'),
  skills: z.array(z.string()).optional()
    .describe('Skills demonstrated or mentioned'),
  confidence_score: z.number().min(0).max(1)
    .describe('Confidence in claim accuracy (0-1)'),
  risk_flags: z.array(z.string()).optional()
    .describe('Any concerns about verifiability'),
})

export const ClaimExtractionResponseSchema = z.object({
  claims: z.array(ExtractedClaimSchema)
    .describe('Array of extracted claims'),
  document_summary: z.string()
    .describe('Brief summary of the document type and content'),
  extraction_notes: z.string().optional()
    .describe('Any notes about the extraction process'),
})

// Type exports
export type Metric = z.infer<typeof MetricSchema>
export type ExtractedClaim = z.infer<typeof ExtractedClaimSchema>
export type ClaimExtractionResponse = z.infer<typeof ClaimExtractionResponseSchema>

// JSON Schema for OpenAI Structured Outputs
export const CLAIM_EXTRACTION_JSON_SCHEMA = {
  name: 'claim_extraction',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      claims: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            claim_type: {
              type: 'string',
              enum: ['achievement', 'responsibility', 'skill', 'credential', 'context'],
              description: 'The type of career claim',
            },
            canonical_text: {
              type: 'string',
              description: 'Clean, professional version of the claim',
            },
            source_text: {
              type: 'string',
              description: 'Original text snippet that supports this claim',
            },
            metrics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  value: { type: 'string', description: 'The numeric value or percentage' },
                  unit: { type: 'string', description: 'The unit of measurement' },
                  context: { type: 'string', description: 'What the metric measures' },
                },
                required: ['value', 'unit', 'context'],
                additionalProperties: false,
              },
              description: 'Any quantifiable metrics mentioned',
            },
            skills: {
              type: 'array',
              items: { type: 'string' },
              description: 'Skills demonstrated or mentioned',
            },
            confidence_score: {
              type: 'number',
              description: 'Confidence in claim accuracy (0-1)',
            },
            risk_flags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Any concerns about verifiability',
            },
          },
          required: ['claim_type', 'canonical_text', 'source_text', 'confidence_score', 'metrics', 'skills', 'risk_flags'],
          additionalProperties: false,
        },
        description: 'Array of extracted claims',
      },
      document_summary: {
        type: 'string',
        description: 'Brief summary of the document type and content',
      },
      extraction_notes: {
        type: 'string',
        description: 'Any notes about the extraction process',
      },
    },
    required: ['claims', 'document_summary', 'extraction_notes'],
    additionalProperties: false,
  },
}
