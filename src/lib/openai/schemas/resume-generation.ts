import { z } from 'zod'

export const ResumeBulletSchema = z.object({
  text: z.string().describe('The bullet point text'),
  source_claim_index: z.number().describe('Index of the source claim (0-based)'),
  impact_level: z.enum(['high', 'medium', 'low']).describe('Expected impact on recruiter'),
})

export const ResumeGenerationSchema = z.object({
  professional_summary: z.string().describe('2-3 sentence professional summary'),

  experience_bullets: z.array(ResumeBulletSchema)
    .describe('Achievement-focused bullet points'),

  skills_highlighted: z.array(z.string())
    .describe('Skills to highlight based on claims and requirements'),

  tailoring_notes: z.string()
    .describe('Notes on how the resume was tailored for this role'),
})

export type ResumeGeneration = z.infer<typeof ResumeGenerationSchema>
export type ResumeBullet = z.infer<typeof ResumeBulletSchema>

// JSON Schema for OpenAI Structured Outputs
export const RESUME_GENERATION_JSON_SCHEMA = {
  name: 'resume_generation',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      professional_summary: {
        type: 'string',
        description: '2-3 sentence professional summary',
      },
      experience_bullets: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'The bullet point text' },
            source_claim_index: { type: 'number', description: 'Index of source claim' },
            impact_level: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
              description: 'Expected impact on recruiter',
            },
          },
          required: ['text', 'source_claim_index', 'impact_level'],
          additionalProperties: false,
        },
        description: 'Achievement-focused bullet points',
      },
      skills_highlighted: {
        type: 'array',
        items: { type: 'string' },
        description: 'Skills to highlight',
      },
      tailoring_notes: {
        type: 'string',
        description: 'Notes on tailoring',
      },
    },
    required: ['professional_summary', 'experience_bullets', 'skills_highlighted', 'tailoring_notes'],
    additionalProperties: false,
  },
}
