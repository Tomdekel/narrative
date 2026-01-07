import { z } from 'zod'

const RequirementSchema = z.object({
  skill: z.string().describe('The specific skill or qualification'),
  experience_level: z.string().optional().describe('Years or proficiency level'),
  context: z.string().optional().describe('Additional context about the requirement'),
})

const ImplicitSignalSchema = z.object({
  signal: z.string().describe('The inferred requirement or characteristic'),
  source_text: z.string().describe('The text that implies this signal'),
  confidence: z.number().min(0).max(1).describe('Confidence in this inference'),
})

export const RoleIntentExtractionSchema = z.object({
  role_title: z.string().describe('The job title'),
  company_name: z.string().optional().describe('Company name if mentioned'),

  seniority_level: z.enum([
    'intern',
    'junior',
    'mid',
    'senior',
    'staff',
    'principal',
    'director',
    'vp',
    'c-level',
  ]).describe('Inferred seniority level'),

  domain: z.string().describe('Primary domain (engineering, product, design, etc.)'),

  role_type: z.enum([
    'individual_contributor',
    'tech_lead',
    'manager',
    'director',
    'executive',
  ]).describe('Type of role'),

  must_haves: z.array(RequirementSchema).describe('Required/essential requirements'),
  nice_to_haves: z.array(RequirementSchema).describe('Preferred/bonus requirements'),
  implicit_signals: z.array(ImplicitSignalSchema).describe('Inferred requirements'),

  responsibilities: z.array(z.string()).describe('Key responsibilities mentioned'),

  success_metrics: z.array(z.string()).optional().describe('How success is measured'),

  team_context: z.object({
    team_size: z.string().optional().describe('Team size if mentioned'),
    reports_to: z.string().optional().describe('Who this role reports to'),
    manages: z.string().optional().describe('Who this role manages'),
  }).optional().describe('Team structure context'),

  summary: z.string().describe('Brief 2-3 sentence summary of the role'),
})

export type RoleIntentExtraction = z.infer<typeof RoleIntentExtractionSchema>
export type Requirement = z.infer<typeof RequirementSchema>
export type ImplicitSignal = z.infer<typeof ImplicitSignalSchema>

// JSON Schema for OpenAI Structured Outputs
export const ROLE_INTENT_JSON_SCHEMA = {
  name: 'role_intent_extraction',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      role_title: { type: 'string', description: 'The job title' },
      company_name: { type: 'string', description: 'Company name if mentioned' },
      seniority_level: {
        type: 'string',
        enum: ['intern', 'junior', 'mid', 'senior', 'staff', 'principal', 'director', 'vp', 'c-level'],
        description: 'Inferred seniority level',
      },
      domain: { type: 'string', description: 'Primary domain' },
      role_type: {
        type: 'string',
        enum: ['individual_contributor', 'tech_lead', 'manager', 'director', 'executive'],
        description: 'Type of role',
      },
      must_haves: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            skill: { type: 'string', description: 'The specific skill or qualification' },
            experience_level: { type: 'string', description: 'Years or proficiency level' },
            context: { type: 'string', description: 'Additional context' },
          },
          required: ['skill', 'experience_level', 'context'],
          additionalProperties: false,
        },
        description: 'Required/essential requirements',
      },
      nice_to_haves: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            skill: { type: 'string', description: 'The specific skill or qualification' },
            experience_level: { type: 'string', description: 'Years or proficiency level' },
            context: { type: 'string', description: 'Additional context' },
          },
          required: ['skill', 'experience_level', 'context'],
          additionalProperties: false,
        },
        description: 'Preferred/bonus requirements',
      },
      implicit_signals: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            signal: { type: 'string', description: 'The inferred requirement' },
            source_text: { type: 'string', description: 'The text that implies this' },
            confidence: { type: 'number', description: 'Confidence 0-1' },
          },
          required: ['signal', 'source_text', 'confidence'],
          additionalProperties: false,
        },
        description: 'Inferred requirements',
      },
      responsibilities: {
        type: 'array',
        items: { type: 'string' },
        description: 'Key responsibilities',
      },
      success_metrics: {
        type: 'array',
        items: { type: 'string' },
        description: 'How success is measured',
      },
      team_context: {
        type: 'object',
        properties: {
          team_size: { type: 'string', description: 'Team size if mentioned' },
          reports_to: { type: 'string', description: 'Who this role reports to' },
          manages: { type: 'string', description: 'Who this role manages' },
        },
        required: ['team_size', 'reports_to', 'manages'],
        additionalProperties: false,
        description: 'Team structure context',
      },
      summary: { type: 'string', description: 'Brief summary of the role' },
    },
    required: [
      'role_title',
      'company_name',
      'seniority_level',
      'domain',
      'role_type',
      'must_haves',
      'nice_to_haves',
      'implicit_signals',
      'responsibilities',
      'success_metrics',
      'team_context',
      'summary',
    ],
    additionalProperties: false,
  },
}
