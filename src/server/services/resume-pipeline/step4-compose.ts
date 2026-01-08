// Step 4: Compose the final tailored CV
// Uses GPT-4o for quality - this is the most important output

import OpenAI from 'openai'
import type {
  CVStructure,
  Claim,
  AttributedClaims,
  RoleAnalysis,
  GeneratedResume,
  RoleIntent
} from './types'

const openai = new OpenAI()

export async function composeResume(params: {
  cvStructure: CVStructure
  claims: Claim[]
  attributedClaims: AttributedClaims
  roleAnalysis: RoleAnalysis
  targetRole: RoleIntent
  guidelines?: string
}): Promise<GeneratedResume> {
  const { cvStructure, claims, attributedClaims, roleAnalysis, targetRole, guidelines } = params

  // Create a map of claim ID to claim for easy lookup
  const claimMap = new Map(claims.map(c => [c.id, c]))

  // Format experience with attributed claims
  const experienceWithClaims = cvStructure.experience.map(job => {
    const jobClaimIds = attributedClaims[job.id] || []
    const jobClaims = jobClaimIds
      .map(id => claimMap.get(id))
      .filter(Boolean)
      .sort((a, b) => (b?.confidence_score || 0) - (a?.confidence_score || 0))
      .slice(0, 8) // Max 8 claims per job

    const suggestedTitle = roleAnalysis.title_suggestions[job.id]

    return {
      ...job,
      suggested_title: suggestedTitle,
      claims: jobClaims.map(c => ({
        type: c!.claim_type,
        text: c!.canonical_text,
        strength: c!.evidence_strength
      }))
    }
  })

  // Format for prompt
  const experienceText = experienceWithClaims.map(job => `
### ${job.company}
Original Title: ${job.title}
${job.suggested_title ? `Suggested Title: ${job.suggested_title}` : ''}
Period: ${job.start_date} - ${job.end_date}
${job.location ? `Location: ${job.location}` : ''}

Claims for this role:
${job.claims.map((c, i) => `${i + 1}. [${c.type}/${c.strength}] ${c.text}`).join('\n')}
`).join('\n')

  // General claims (not attributed to specific jobs)
  const generalClaimIds = attributedClaims['general'] || []
  const generalClaims = generalClaimIds
    .map(id => claimMap.get(id))
    .filter(Boolean)

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert CV writer creating a tailored, professional CV.

## OUTPUT REQUIREMENTS

You must produce a complete, properly structured CV with these sections:

1. **Contact**: Use the provided contact info
2. **Summary**: 2-4 impactful sentences positioning the candidate for this role. Use the narrative angle and themes provided.
3. **Experience**: For each job:
   - Use suggested titles if provided (they're pre-approved reframes)
   - Write 3-5 achievement bullets using ONLY the claims provided
   - Start each bullet with a strong action verb
   - Include metrics where available
   - Prioritize claims that match the target role
4. **Education**: Include all education entries
5. **Skills**: Group skills by category, prioritize role-relevant skills

## WRITING RULES

- ONLY use information from the claims - never fabricate
- Use strong action verbs (Led, Built, Drove, Designed, Implemented, etc.)
- Keep bullets to 1-2 lines
- Prioritize achievements over responsibilities
- Match the tone and terminology of the target role/industry
- Be concise but impactful
${guidelines ? `
## MANDATORY USER GUIDELINES
The user has specified the following writing guidelines that you MUST follow:

${guidelines}

These guidelines take precedence over default formatting rules.` : ''}

Return JSON with this structure:
{
  "contact": {
    "name": "string",
    "headline": "string - role-relevant professional headline",
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null",
    "linkedin": "string or null"
  },
  "summary": "string - 2-4 sentence professional summary",
  "experience": [
    {
      "company": "string",
      "title": "string - use suggested title if provided",
      "original_title": "string or null - only if title was changed",
      "start_date": "string",
      "end_date": "string",
      "location": "string or null",
      "achievements": ["bullet 1", "bullet 2", ...]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string or null",
      "year": "string",
      "honors": "string or null"
    }
  ],
  "skills": [
    {
      "category": "string - e.g., Product, Technical, Leadership",
      "items": ["skill1", "skill2"]
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string or null",
      "year": "string or null"
    }
  ],
  "metadata": {
    "tailoring_notes": "string - brief explanation of tailoring",
    "narrative_angle": "string - the story being told"
  }
}`
      },
      {
        role: 'user',
        content: `## TARGET ROLE
Title: ${targetRole.title_raw}
Company: ${targetRole.company_raw || 'Not specified'}
Level: ${targetRole.level_inferred || 'Not specified'}
Domain: ${targetRole.domain || 'Not specified'}

## NARRATIVE STRATEGY
Angle: ${roleAnalysis.narrative_angle}
Emphasis: ${roleAnalysis.emphasis_points.join(', ')}
Summary themes: ${roleAnalysis.summary_themes.join(', ')}
${roleAnalysis.tailoring_notes}

## CONTACT INFO
Name: ${cvStructure.contact.name}
Email: ${cvStructure.contact.email || 'Not provided'}
Phone: ${cvStructure.contact.phone || 'Not provided'}
Location: ${cvStructure.contact.location || 'Not provided'}
LinkedIn: ${cvStructure.contact.linkedin || 'Not provided'}

## EXPERIENCE WITH CLAIMS
${experienceText}

## EDUCATION
${cvStructure.education
  .filter(edu => {
    const badValues = ['null', 'undefined', 'optional', 'N/A', 'n/a']
    const hasBadInstitution = !edu.institution || badValues.some(v => edu.institution.toLowerCase().includes(v))
    const hasBadDegree = !edu.degree || badValues.some(v => edu.degree.toLowerCase().includes(v))
    return !hasBadInstitution && !hasBadDegree
  })
  .map(edu => {
    const badValues = ['null', 'undefined', 'optional', 'N/A', 'n/a']
    const isBad = (val: string | undefined) => !val || badValues.some(v => val.toLowerCase().includes(v))
    const field = !isBad(edu.field) ? ` in ${edu.field}` : ''
    const honors = !isBad(edu.honors) ? ` (${edu.honors})` : ''
    const year = !isBad(edu.year) ? edu.year : ''
    return `${edu.degree}${field}, ${edu.institution}${year ? `, ${year}` : ''}${honors}`
  })
  .join('\n')}

## SKILLS
${cvStructure.skills.join(', ')}

${cvStructure.certifications?.length ? `## CERTIFICATIONS
${cvStructure.certifications.join('\n')}` : ''}

${generalClaims.length > 0 ? `## ADDITIONAL ACHIEVEMENTS (not job-specific)
${generalClaims.map((c, i) => `${i + 1}. [${c!.claim_type}] ${c!.canonical_text}`).join('\n')}` : ''}

Compose the complete tailored CV.`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.6,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No content returned from CV composition')
  }

  return JSON.parse(content) as GeneratedResume
}
