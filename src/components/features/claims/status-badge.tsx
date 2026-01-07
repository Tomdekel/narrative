'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type TruthStatus = 'unverified' | 'verified' | 'disputed'

type Props = {
  status: TruthStatus
}

const statusConfig: Record<TruthStatus, { color: string; tooltip: string }> = {
  unverified: {
    color: 'bg-gray-100 text-gray-600',
    tooltip: 'Auto-extracted from your documents. Review and verify to use in resumes.'
  },
  verified: {
    color: 'bg-green-100 text-green-800',
    tooltip: 'You\'ve confirmed this claim is accurate and ready to use.'
  },
  disputed: {
    color: 'bg-red-100 text-red-800',
    tooltip: 'Marked as inaccurate or not suitable for use.'
  },
}

export function StatusBadge({ status }: Props) {
  const config = statusConfig[status] || statusConfig.unverified

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`px-2 py-1 rounded text-xs cursor-help ${config.color}`}>
          {status}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{config.tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}
