'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { updateClaimStatus } from '@/server/actions/claims'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type TruthStatus = 'unverified' | 'verified' | 'disputed'

type Props = {
  claimId: string
  initialStatus: TruthStatus
}

const statusOptions: { value: TruthStatus; label: string; color: string; tooltip: string }[] = [
  {
    value: 'unverified',
    label: 'Unverified',
    color: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
    tooltip: 'Auto-extracted from your documents. Review and verify to use in resumes.'
  },
  {
    value: 'verified',
    label: 'Verified',
    color: 'bg-green-100 text-green-800 hover:bg-green-200',
    tooltip: 'You\'ve confirmed this claim is accurate and ready to use.'
  },
  {
    value: 'disputed',
    label: 'Disputed',
    color: 'bg-red-100 text-red-800 hover:bg-red-200',
    tooltip: 'Marked as inaccurate or not suitable for use.'
  },
]

export function StatusSelector({ claimId, initialStatus }: Props) {
  const [status, setStatus] = useState<TruthStatus>(initialStatus)
  const [saving, setSaving] = useState(false)

  const handleStatusChange = async (newStatus: TruthStatus) => {
    if (newStatus === status) return

    setSaving(true)
    const result = await updateClaimStatus(claimId, newStatus)
    setSaving(false)

    if (result.success) {
      setStatus(newStatus)
      toast.success(`Claim marked as ${newStatus}`)
    } else {
      toast.error(result.error || 'Failed to update status')
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-500">Truth Status</label>
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <Tooltip key={option.value}>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleStatusChange(option.value)}
                disabled={saving}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                  ${status === option.value
                    ? option.color.replace('hover:', '')
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }
                  ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {option.label}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{option.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
