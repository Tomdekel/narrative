'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type Match = {
  claim_id: string
  total_score: number
  matched_requirements: string[]
}

type Claim = {
  id: string
  canonical_text: string
  claim_type: string
  evidence_strength: string
}

type Requirement = {
  skill: string
  experience_level?: string
  context?: string
}

interface HowYouFitProps {
  matches: Match[]
  claims: Record<string, Claim>
  mustHaves: Requirement[]
  coveredMustHaves: Requirement[]
  missingMustHaves: Requirement[]
  roleId: string
}

export function HowYouFit({
  matches,
  claims,
  mustHaves,
  coveredMustHaves,
  missingMustHaves,
  roleId,
}: HowYouFitProps) {
  // Categorize matches by score
  const strongFit = matches.filter(m => m.total_score >= 0.7)
  const looseFit = matches.filter(m => m.total_score >= 0.5 && m.total_score < 0.7)
  const stretch = matches.filter(m => m.total_score >= 0.3 && m.total_score < 0.5)

  // Get claim IDs that are matched
  const matchedClaimIds = new Set(matches.map(m => m.claim_id))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">How You Fit This Role</CardTitle>
          <Link href={`/dashboard/roles/${roleId}/generate?claims=${strongFit.map(m => m.claim_id).join(',')}`}>
            <Button>
              Generate Tailored Resume
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Strong Fit */}
        {strongFit.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-green-700 mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Strong Fit ({strongFit.length})
            </h3>
            <div className="space-y-2 pl-7">
              {strongFit.slice(0, 5).map(match => {
                const claim = claims[match.claim_id]
                if (!claim) return null
                return (
                  <div key={match.claim_id} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">-</span>
                    <span className="text-gray-700 text-sm">{claim.canonical_text}</span>
                  </div>
                )
              })}
              {strongFit.length > 5 && (
                <p className="text-xs text-gray-500">+{strongFit.length - 5} more strong matches</p>
              )}
            </div>
          </div>
        )}

        {/* Loose Fit */}
        {looseFit.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-yellow-700 mb-3">
              <span className="text-yellow-500 text-lg">~</span>
              Loose Fit ({looseFit.length})
            </h3>
            <div className="space-y-2 pl-7">
              {looseFit.slice(0, 3).map(match => {
                const claim = claims[match.claim_id]
                if (!claim) return null
                return (
                  <div key={match.claim_id} className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">~</span>
                    <div className="flex-1">
                      <span className="text-gray-700 text-sm">{claim.canonical_text}</span>
                      {match.matched_requirements.length > 0 && (
                        <span className="text-xs text-gray-500 ml-2">
                          (related to: {match.matched_requirements.slice(0, 2).join(', ')})
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Stretch */}
        {stretch.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-orange-700 mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Stretch ({stretch.length})
            </h3>
            <div className="space-y-2 pl-7">
              {stretch.slice(0, 3).map(match => {
                const claim = claims[match.claim_id]
                if (!claim) return null
                return (
                  <div key={match.claim_id} className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">-</span>
                    <span className="text-gray-600 text-sm">{claim.canonical_text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Gaps */}
        {missingMustHaves.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-red-700 mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Gaps to Address ({missingMustHaves.length})
            </h3>
            <div className="space-y-2 pl-7">
              {missingMustHaves.map((req, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">-</span>
                  <div className="flex-1">
                    <span className="text-gray-700 text-sm font-medium">{req.skill}</span>
                    {req.experience_level && (
                      <span className="text-xs text-gray-500 ml-2">({req.experience_level})</span>
                    )}
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-500 mt-2 italic">
                Consider how adjacent experience might bridge these gaps
              </p>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-green-600 font-medium">{strongFit.length} strong</span>
              <span className="text-yellow-600 font-medium">{looseFit.length} loose</span>
              <span className="text-orange-600 font-medium">{stretch.length} stretch</span>
              <span className="text-red-600 font-medium">{missingMustHaves.length} gaps</span>
            </div>
            <span className="text-gray-500">
              {coveredMustHaves.length}/{mustHaves.length} must-haves covered
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
