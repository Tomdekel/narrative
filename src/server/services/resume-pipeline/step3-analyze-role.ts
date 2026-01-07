// Step 3: Analyze role fit and determine narrative angle
// Uses GPT-4o for intelligence - this requires strategic thinking

import OpenAI from 'openai'
import type { CVStructure, Claim, RoleIntent, RoleAnalysis } from './types'

const openai = new OpenAI()

export async function analyzeRoleAndNarrative(params: {
  targetRole: RoleIntent
  cvStructure: CVStructure
  claims: Claim[]
  careerContext?: string
}): Promise<RoleAnalysis> {
  const { targetRole, cvStructure, claims, careerContext } = params

  // Format experience summary
  const experienceSummary = cvStructure.experience
    .map(exp => `- ${exp.title} at ${exp.company} (${exp.start_date} - ${exp.end_date})`)
    .join('\n')

  // Format key claims
  const topClaims = claims
    .sort((a, b) => b.confidence_score - a.confidence_score)
    .slice(0, 20)
    .map((c, i) => `${i + 1}. [${c.claim_type}] ${c.canonical_text}`)
    .join('\n')

  // Format requirements
  const mustHaves = (targetRole.must_haves || [])
    .map((r, i) => `${i + 1}. ${r.skill}${r.experience_level ? ` (${r.experience_level})` : ''}`)
    .join('\n')

  const implicitSignals = (targetRole.implicit_signals || [])
    .map((s, i) => `${i + 1}. ${s.signal}`)
    .join('\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a senior career strategist. Analyze how to best position this candidate for the target role.

Your job is to:
1. Identify the NARRATIVE ANGLE - the compelling story that connects their background to this role
2. Determine EMPHASIS POINTS - what aspects of their experience to highlight
3. Suggest TITLE TWEAKS - small adjustments to job titles that more accurately reflect their work (must be truthful but can reframe)
4. Identify SUMMARY THEMES - key themes for the professional summary

Rules for title suggestions:
- Only suggest if there's a legitimate reframe (e.g., "PM" → "Product Manager" is fine)
- "Head of Product" at a startup can be "Head of Product" or "Product Lead"
- Don't change company names or dates
- Don't invent seniority that didn't exist

Return JSON:
{
  "narrative_angle": "One sentence describing the compelling story for this application",
  "emphasis_points": ["Point 1", "Point 2", "Point 3"],
  "title_suggestions": {
    "exp_1": "Suggested title only if different from original"
  },
  "summary_themes": ["Theme 1", "Theme 2"],
  "tailoring_notes": "Brief explanation of the tailoring strategy"
}`
      },
      {
        role: 'user',
        content: `## TARGET ROLE
Title: ${targetRole.title_raw}
Company: ${targetRole.company_raw || 'Not specified'}
Level: ${targetRole.level_inferred || 'Not specified'}
Domain: ${targetRole.domain || 'Not specified'}
Function: ${targetRole.function_inferred || 'Not specified'}

## KEY REQUIREMENTS
${mustHaves || 'None specified'}

## IMPLICIT SIGNALS
${implicitSignals || 'None identified'}

${targetRole.user_corrections ? `## USER NOTES
${targetRole.user_corrections}` : ''}

## CANDIDATE EXPERIENCE
${experienceSummary}

## KEY ACHIEVEMENTS
${topClaims}

${careerContext ? `## CAREER CONTEXT
${careerContext}` : ''}

Analyze how to best position this candidate for the role.`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No content returned from role analysis')
  }

  return JSON.parse(content) as RoleAnalysis
}
