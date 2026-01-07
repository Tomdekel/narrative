'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type MatchResult = {
  claim_id: string
  total_score: number
  skill_match_score: number
  evidence_score: number
  type_relevance_score: number
  matched_requirements: string[]
  match_type: 'must_have' | 'nice_to_have' | 'general'
}

type Claim = {
  id: string
  canonical_text: string
  claim_type: string
  evidence_strength: string
}

type Props = {
  matches: MatchResult[]
  claims: Record<string, Claim>
  roleId: string
  onSelectClaims?: (claimIds: string[]) => void
}

const claimTypeColors: Record<string, string> = {
  achievement: 'bg-green-100 text-green-800',
  responsibility: 'bg-blue-100 text-blue-800',
  skill: 'bg-purple-100 text-purple-800',
  credential: 'bg-yellow-100 text-yellow-800',
  context: 'bg-gray-100 text-gray-800',
}

const matchTypeLabels: Record<string, { label: string; color: string }> = {
  must_have: { label: 'Must-Have Match', color: 'text-green-600' },
  nice_to_have: { label: 'Nice-to-Have Match', color: 'text-blue-600' },
  general: { label: 'General Relevance', color: 'text-gray-500' },
}

export function ClaimRecommendations({ matches, claims, roleId, onSelectClaims }: Props) {
  const [selectedClaims, setSelectedClaims] = useState<Set<string>>(new Set())

  const toggleClaim = (claimId: string) => {
    const newSelected = new Set(selectedClaims)
    if (newSelected.has(claimId)) {
      newSelected.delete(claimId)
    } else {
      newSelected.add(claimId)
    }
    setSelectedClaims(newSelected)
    onSelectClaims?.(Array.from(newSelected))
  }

  const selectAll = () => {
    const allIds = matches.map(m => m.claim_id)
    setSelectedClaims(new Set(allIds))
    onSelectClaims?.(allIds)
  }

  const clearSelection = () => {
    setSelectedClaims(new Set())
    onSelectClaims?.([])
  }

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">No claims match this role yet.</p>
          <Link href="/dashboard/artifacts/upload" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
            Upload a document to extract claims
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recommended Claims</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          {selectedClaims.size > 0 && (
            <Button variant="outline" size="sm" onClick={clearSelection}>
              Clear ({selectedClaims.size})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {matches.map((match) => {
            const claim = claims[match.claim_id]
            if (!claim) return null

            const isSelected = selectedClaims.has(match.claim_id)
            const matchInfo = matchTypeLabels[match.match_type]

            return (
              <div
                key={match.claim_id}
                onClick={() => toggleClaim(match.claim_id)}
                className={`
                  p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                    ${isSelected
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                    }
                  `}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${claimTypeColors[claim.claim_type]}`}>
                        {claim.claim_type}
                      </span>
                      <span className={`text-xs font-medium ${matchInfo.color}`}>
                        {matchInfo.label}
                      </span>
                    </div>
                    <p className="text-gray-900 text-sm">{claim.canonical_text}</p>
                    {match.matched_requirements.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {match.matched_requirements.map((req, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {req}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {Math.round(match.total_score * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">match</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {selectedClaims.size > 0 && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedClaims.size} claim{selectedClaims.size !== 1 ? 's' : ''} selected
            </span>
            <Link href={`/dashboard/roles/${roleId}/generate?claims=${Array.from(selectedClaims).join(',')}`}>
              <Button>Generate Resume</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
