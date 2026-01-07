// Types for the multi-step resume generation pipeline

export type ContactInfo = {
  name: string
  headline?: string
  email?: string
  phone?: string
  location?: string
  linkedin?: string
}

export type ParsedExperience = {
  id: string // Generated ID for attribution
  company: string
  title: string
  start_date: string
  end_date: string | 'Present'
  location?: string
  description?: string
}

export type ParsedEducation = {
  institution: string
  degree: string
  field?: string
  year: string
  honors?: string
}

export type CVStructure = {
  contact: ContactInfo
  experience: ParsedExperience[]
  education: ParsedEducation[]
  skills: string[]
  certifications?: string[]
}

export type Claim = {
  id: string
  canonical_text: string
  claim_type: string
  evidence_strength: string
  confidence_score: number
}

export type AttributedClaims = Record<string, string[]> // job_id -> claim_ids

export type RoleAnalysis = {
  narrative_angle: string
  emphasis_points: string[]
  title_suggestions: Record<string, string> // job_id -> suggested title
  summary_themes: string[]
  tailoring_notes: string
}

export type GeneratedExperience = {
  company: string
  title: string
  original_title?: string
  start_date: string
  end_date: string | 'Present'
  location?: string
  achievements: string[]
}

export type GeneratedEducation = {
  institution: string
  degree: string
  field?: string
  year: string
  honors?: string
}

export type GeneratedSkillCategory = {
  category: string
  items: string[]
}

export type GeneratedCertification = {
  name: string
  issuer?: string
  year?: string
}

export type GeneratedResume = {
  contact: ContactInfo
  summary: string
  experience: GeneratedExperience[]
  education: GeneratedEducation[]
  skills: GeneratedSkillCategory[]
  certifications?: GeneratedCertification[]
  metadata: {
    tailoring_notes: string
    narrative_angle: string
  }
}

export type RoleIntent = {
  id: string
  title_raw: string
  company_raw?: string
  level_inferred?: string
  function_inferred?: string
  domain?: string
  must_haves?: { skill: string; experience_level?: string; context?: string }[]
  nice_to_haves?: { skill: string }[]
  implicit_signals?: { signal: string }[]
  fit_analysis?: unknown
  user_corrections?: string
}

export type PipelineInput = {
  cvText: string
  claims: Claim[]
  targetRole: RoleIntent
  careerContext?: string
  guidelines?: string
}

export type PipelineProgress = {
  step: 1 | 2 | 3 | 4
  stepName: string
  completed: boolean
}
