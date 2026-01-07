'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Claim = {
  id: string
  canonical_text: string
  claim_type: string
  evidence_strength: string
  confidence_score: number
}

interface ExperienceCardProps {
  title: string
  claims: Claim[]
}

const claimTypeLabels: Record<string, string> = {
  achievement: 'Achievement',
  responsibility: 'Responsibility',
  skill: 'Skill',
  credential: 'Credential',
  context: 'Context',
}

const claimTypeColors: Record<string, string> = {
  achievement: 'bg-green-100 text-green-700',
  responsibility: 'bg-blue-100 text-blue-700',
  skill: 'bg-purple-100 text-purple-700',
  credential: 'bg-yellow-100 text-yellow-700',
  context: 'bg-gray-100 text-gray-700',
}

export function ExperienceCard({ title, claims }: ExperienceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Clean up filename for display
  const displayTitle = title
    .replace(/\.[^/.]+$/, '') // Remove file extension
    .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
    .replace(/^\d+\s*/, '') // Remove leading numbers

  const visibleClaims = isExpanded ? claims : claims.slice(0, 3)
  const hasMore = claims.length > 3

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{displayTitle}</h3>
              <p className="text-xs text-gray-500">{claims.length} insight{claims.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              {isExpanded ? 'Show less' : `Show all ${claims.length}`}
            </Button>
          )}
        </div>

        <ul className="space-y-2">
          {visibleClaims.map((claim) => (
            <li key={claim.id} className="flex items-start gap-2 text-sm">
              <span className="text-gray-400 mt-0.5">-</span>
              <div className="flex-1">
                <span className="text-gray-700">{claim.canonical_text}</span>
                <span
                  className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                    claimTypeColors[claim.claim_type] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {claimTypeLabels[claim.claim_type] || claim.claim_type}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
