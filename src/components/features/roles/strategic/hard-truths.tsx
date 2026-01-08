'use client'

import type { HardTruths as HardTruthsType } from '@/server/services/resume-pipeline/types'
import { cn } from '@/lib/utils'

interface HardTruthsProps {
  data: HardTruthsType
}

const seniorityColors: Record<string, { bg: string; text: string; label: string }> = {
  over_senior: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Over-Senior' },
  right_fit: { bg: 'bg-green-50', text: 'text-green-700', label: 'Right Level' },
  under_senior: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Under-Senior' },
}

export function HardTruths({ data }: HardTruthsProps) {
  const seniority = seniorityColors[data.seniority_signal.assessment] || seniorityColors.right_fit

  return (
    <div className="space-y-6 pt-4">
      {/* Seniority Signal */}
      <div className={cn('p-4 rounded-lg border', seniority.bg)}>
        <div className="flex items-center gap-2 mb-2">
          <svg className={cn('w-5 h-5', seniority.text)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className={cn('font-medium', seniority.text)}>Seniority Match: {seniority.label}</span>
        </div>
        <p className={cn('text-sm', seniority.text)}>{data.seniority_signal.explanation}</p>
      </div>

      {/* Trajectory Concerns */}
      {data.trajectory_concerns.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Career Trajectory Concerns
          </h4>
          <div className="space-y-2">
            {data.trajectory_concerns.map((item, idx) => (
              <div key={idx} className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="font-medium text-amber-900">{item.concern}</p>
                <p className="text-sm text-amber-700 mt-1 italic">{item.how_it_looks}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unhideable Gaps */}
      {data.unhideable_gaps.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Gaps You Can&apos;t Hide
          </h4>
          <div className="space-y-2">
            {data.unhideable_gaps.map((item, idx) => (
              <div key={idx} className="p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="font-medium text-red-900">{item.gap}</p>
                <div className="mt-2 pt-2 border-t border-red-200">
                  <p className="text-sm font-medium text-gray-700">Best approach:</p>
                  <p className="text-sm text-gray-600 mt-1">{item.best_approach}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* If no issues */}
      {data.trajectory_concerns.length === 0 && data.unhideable_gaps.length === 0 && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-700 font-medium">No major red flags identified in your background.</p>
          </div>
        </div>
      )}
    </div>
  )
}
