// Step 1: Parse CV structure from raw text
// Uses GPT-4o-mini for speed - this is a straightforward extraction task

import OpenAI from 'openai'
import type { CVStructure } from './types'

const openai = new OpenAI()

export async function parseCVStructure(cvText: string): Promise<CVStructure> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a CV parser. Extract structured data from the CV text.

IMPORTANT:
- Extract EXACT dates as written (e.g., "Jan 2021", "2019", "Present")
- Keep company names and titles exactly as written
- For education, extract the degree type (B.Sc., M.A., MBA, etc.) and field separately
- Skills should be individual items, not categories
- NEVER use null, undefined, "optional", "N/A", "not specified", "not provided", or any placeholder values
- Simply OMIT optional fields entirely if no real data exists - do not include them at all
- For education: only include entries with real institution names (universities, colleges, schools)
- For years: only include actual years (e.g., "2015", "2020") - completely omit the year field if unknown

Return JSON with this exact structure:
{
  "contact": {
    "name": "string",
    "headline": "optional string - professional headline if present",
    "email": "optional string",
    "phone": "optional string",
    "location": "optional string",
    "linkedin": "optional string"
  },
  "experience": [
    {
      "id": "exp_1",
      "company": "Company Name",
      "title": "Job Title",
      "start_date": "Jan 2021",
      "end_date": "Present or Dec 2023",
      "location": "optional",
      "description": "optional - brief description if present"
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "B.Sc. (required - use 'Certificate' or 'Program' if unclear)",
      "field": "Computer Science (omit if not applicable)",
      "year": "2015",
      "honors": "Cum Laude, etc. (omit if none)"
    }
  ],
  "skills": ["Skill1", "Skill2"],
  "certifications": ["optional"]
}`
      },
      {
        role: 'user',
        content: `Parse this CV and extract the structured data:\n\n${cvText}`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1, // Low temperature for consistent extraction
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No content returned from CV parser')
  }

  const parsed = JSON.parse(content) as CVStructure

  // Ensure experience items have IDs
  parsed.experience = parsed.experience.map((exp, i) => ({
    ...exp,
    id: exp.id || `exp_${i + 1}`
  }))

  return parsed
}
