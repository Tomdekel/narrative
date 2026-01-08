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

// Strategic Assessment Types (Step 3.5)

export type SignalStrength = 'critical' | 'important' | 'nice_to_have'
export type Tone = 'very_positive' | 'positive' | 'neutral' | 'concerning'
export type Severity = 'blocker' | 'yellow_flag' | 'minor'
export type SeniorityAssessment = 'over_senior' | 'right_fit' | 'under_senior'
export type Recommendation = 'strong_apply' | 'apply_with_strategy' | 'stretch_apply' | 'consider_alternatives'
export type SuccessProbability = 'high' | 'medium' | 'low'

export type RoleDeconstruction = {
  actual_priorities: {
    requirement: string
    why_it_matters: string
    signal_strength: SignalStrength
  }[]
  marketing_vs_reality: {
    stated: string
    actual_meaning: string
  }[]
  hiring_signals: {
    signal: string
    evidence_from_jd: string
  }[]
}

export type CompanyView = {
  first_impression: {
    headline: string
    tone: Tone
  }
  perceived_strengths: {
    strength: string
    from_company_pov: string
  }[]
  perceived_weaknesses: {
    concern: string
    severity: Severity
  }[]
  likely_objections: {
    objection: string
    hiring_manager_thinking: string
    suggested_preempt: string
  }[]
}

export type HardTruths = {
  seniority_signal: {
    assessment: SeniorityAssessment
    explanation: string
  }
  trajectory_concerns: {
    concern: string
    how_it_looks: string
  }[]
  unhideable_gaps: {
    gap: string
    best_approach: string
  }[]
  net_fit_assessment: {
    recommendation: Recommendation
    honest_take: string
    success_probability: SuccessProbability
  }
}

export type SignalStrategy = {
  signals_to_amplify: {
    signal: string
    how_to_amplify: string
  }[]
  signals_to_downplay: {
    signal: string
    how_to_reframe: string
  }[]
  narrative_angle: {
    primary_story: string
    opens_with: string
  }
}

export type NextSteps = {
  stories_to_prepare: {
    story_prompt: string
    interview_question_type: string
  }[]
  positioning_advice: {
    advice: string
    reasoning: string
  }[]
  before_applying: {
    action: string
    why: string
  }[]
}

export type StrategicAssessment = {
  role_deconstruction: RoleDeconstruction
  company_view: CompanyView
  hard_truths: HardTruths
  signal_strategy: SignalStrategy
  next_steps: NextSteps
}
