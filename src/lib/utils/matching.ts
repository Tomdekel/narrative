/**
 * Claim-Role Matching Algorithm
 *
 * Deterministic scoring based on:
 * 1. Skill overlap (direct match between claim skills and role requirements)
 * 2. Evidence strength (claims with stronger evidence score higher)
 * 3. Claim type relevance (achievements > responsibilities for most roles)
 * 4. Confidence score (AI extraction confidence)
 */

type Claim = {
  id: string
  canonical_text: string
  claim_type: string
  evidence_strength: string
  confidence_score: number
  skills: string[]
  created_at: string
}

type Requirement = {
  skill: string
  experience_level?: string
  context?: string
}

type RoleIntent = {
  must_haves: Requirement[]
  nice_to_haves: Requirement[]
  seniority_level: string
  domain: string
}

type MatchResult = {
  claim_id: string
  total_score: number
  skill_match_score: number
  evidence_score: number
  type_relevance_score: number
  matched_requirements: string[]
  match_type: 'must_have' | 'nice_to_have' | 'general'
}

// Weights for different scoring components
const WEIGHTS = {
  skill_match: 0.5,      // 50% - skill overlap is most important
  evidence: 0.25,        // 25% - evidence strength matters
  type_relevance: 0.15,  // 15% - claim type relevance
  confidence: 0.10,      // 10% - AI confidence
}

// Evidence strength scores
const EVIDENCE_SCORES: Record<string, number> = {
  strong: 1.0,
  medium: 0.6,
  weak: 0.3,
}

// Claim type relevance by role type
const TYPE_RELEVANCE: Record<string, Record<string, number>> = {
  individual_contributor: {
    achievement: 1.0,
    skill: 0.9,
    responsibility: 0.7,
    credential: 0.5,
    context: 0.3,
  },
  tech_lead: {
    achievement: 1.0,
    responsibility: 0.9,
    skill: 0.8,
    credential: 0.5,
    context: 0.4,
  },
  manager: {
    responsibility: 1.0,
    achievement: 0.9,
    skill: 0.6,
    credential: 0.5,
    context: 0.4,
  },
  director: {
    achievement: 1.0,
    responsibility: 0.9,
    skill: 0.5,
    credential: 0.6,
    context: 0.5,
  },
  executive: {
    achievement: 1.0,
    responsibility: 0.8,
    credential: 0.7,
    context: 0.6,
    skill: 0.4,
  },
}

/**
 * Calculate skill match score between claim skills and role requirements
 */
function calculateSkillMatchScore(
  claimSkills: string[],
  mustHaves: Requirement[],
  niceToHaves: Requirement[]
): { score: number; matched: string[]; matchType: 'must_have' | 'nice_to_have' | 'general' } {
  const claimSkillsLower = claimSkills.map(s => s.toLowerCase())
  const matchedMustHaves: string[] = []
  const matchedNiceToHaves: string[] = []

  // Check must-haves (weight: 1.0)
  for (const req of mustHaves) {
    if (claimSkillsLower.some(s =>
      s.includes(req.skill.toLowerCase()) ||
      req.skill.toLowerCase().includes(s)
    )) {
      matchedMustHaves.push(req.skill)
    }
  }

  // Check nice-to-haves (weight: 0.5)
  for (const req of niceToHaves) {
    if (claimSkillsLower.some(s =>
      s.includes(req.skill.toLowerCase()) ||
      req.skill.toLowerCase().includes(s)
    )) {
      matchedNiceToHaves.push(req.skill)
    }
  }

  const totalRequirements = mustHaves.length + (niceToHaves.length * 0.5)
  if (totalRequirements === 0) {
    return { score: 0.5, matched: [], matchType: 'general' }
  }

  const matchScore = (matchedMustHaves.length + (matchedNiceToHaves.length * 0.5)) / totalRequirements

  const matchType = matchedMustHaves.length > 0
    ? 'must_have'
    : matchedNiceToHaves.length > 0
    ? 'nice_to_have'
    : 'general'

  return {
    score: Math.min(matchScore, 1.0),
    matched: [...matchedMustHaves, ...matchedNiceToHaves],
    matchType,
  }
}

/**
 * Calculate overall match score for a claim against a role
 */
export function calculateClaimRoleMatch(
  claim: Claim,
  role: RoleIntent,
  roleType: string = 'individual_contributor'
): MatchResult {
  // 1. Skill match score
  const skillMatch = calculateSkillMatchScore(
    claim.skills,
    role.must_haves,
    role.nice_to_haves
  )

  // 2. Evidence strength score
  const evidenceScore = EVIDENCE_SCORES[claim.evidence_strength] || 0.5

  // 3. Type relevance score
  const typeRelevance = TYPE_RELEVANCE[roleType]?.[claim.claim_type] || 0.5

  // 4. Confidence score (already 0-1)
  const confidenceScore = claim.confidence_score

  // Calculate weighted total
  const totalScore =
    (skillMatch.score * WEIGHTS.skill_match) +
    (evidenceScore * WEIGHTS.evidence) +
    (typeRelevance * WEIGHTS.type_relevance) +
    (confidenceScore * WEIGHTS.confidence)

  return {
    claim_id: claim.id,
    total_score: Math.round(totalScore * 100) / 100,
    skill_match_score: Math.round(skillMatch.score * 100) / 100,
    evidence_score: evidenceScore,
    type_relevance_score: typeRelevance,
    matched_requirements: skillMatch.matched,
    match_type: skillMatch.matchType,
  }
}

/**
 * Rank all claims for a role, sorted by total score
 */
export function rankClaimsForRole(
  claims: Claim[],
  role: RoleIntent,
  roleType: string = 'individual_contributor'
): MatchResult[] {
  const matches = claims.map(claim => calculateClaimRoleMatch(claim, role, roleType))

  // Sort by total score descending, then by skill match score
  return matches.sort((a, b) => {
    if (b.total_score !== a.total_score) {
      return b.total_score - a.total_score
    }
    return b.skill_match_score - a.skill_match_score
  })
}

/**
 * Get recommended claims for a role (top N with minimum score threshold)
 */
export function getRecommendedClaims(
  claims: Claim[],
  role: RoleIntent,
  roleType: string = 'individual_contributor',
  options: { maxClaims?: number; minScore?: number } = {}
): MatchResult[] {
  const { maxClaims = 10, minScore = 0.3 } = options

  const ranked = rankClaimsForRole(claims, role, roleType)

  return ranked
    .filter(m => m.total_score >= minScore)
    .slice(0, maxClaims)
}
