'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { updateClaimText, deleteClaim } from '@/server/actions/claims'
import { toast } from 'sonner'

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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [localClaims, setLocalClaims] = useState(claims)

  // Clean up filename for display
  const displayTitle = title
    .replace(/\.[^/.]+$/, '') // Remove file extension
    .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
    .replace(/^\d+\s*/, '') // Remove leading numbers

  const visibleClaims = isExpanded ? localClaims : localClaims.slice(0, 3)
  const hasMore = localClaims.length > 3

  const handleEdit = (claim: Claim) => {
    setEditingId(claim.id)
    setEditText(claim.canonical_text)
  }

  const handleSave = async (claimId: string) => {
    if (!editText.trim()) {
      toast.error('Insight text cannot be empty')
      return
    }

    startTransition(async () => {
      const result = await updateClaimText(claimId, editText.trim())
      if (result.error) {
        toast.error(result.error)
      } else {
        // Update local state
        setLocalClaims(prev =>
          prev.map(c =>
            c.id === claimId ? { ...c, canonical_text: editText.trim() } : c
          )
        )
        setEditingId(null)
        toast.success('Insight updated')
      }
    })
  }

  const handleDelete = async (claimId: string) => {
    if (!confirm('Are you sure you want to delete this insight?')) return

    startTransition(async () => {
      const result = await deleteClaim(claimId)
      if (result.error) {
        toast.error(result.error)
      } else {
        // Update local state
        setLocalClaims(prev => prev.filter(c => c.id !== claimId))
        toast.success('Insight deleted')
      }
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditText('')
  }

  if (localClaims.length === 0) {
    return null
  }

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
              <p className="text-xs text-gray-500">{localClaims.length} insight{localClaims.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              {isExpanded ? 'Show less' : `Show all ${localClaims.length}`}
            </Button>
          )}
        </div>

        <ul className="space-y-2">
          {visibleClaims.map((claim) => (
            <li key={claim.id} className="group">
              {editingId === claim.id ? (
                <div className="space-y-2 p-2 bg-gray-50 rounded-lg">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-200 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSave(claim.id)}
                      disabled={isPending}
                    >
                      {isPending ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 mt-0.5">-</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-700">{claim.canonical_text}</span>
                    <span
                      className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                        claimTypeColors[claim.claim_type] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {claimTypeLabels[claim.claim_type] || claim.claim_type}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(claim)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(claim.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                      title="Delete"
                      disabled={isPending}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
