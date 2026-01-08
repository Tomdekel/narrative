'use client'

import type { CompanyView as CompanyViewType } from '@/server/services/resume-pipeline/types'
import { cn } from '@/lib/utils'

interface CompanyViewProps {
  data: CompanyViewType
}

const toneColors: Record<string, { bg: string; text: string; icon: string }> = {
  very_positive: { bg: 'bg-green-100', text: 'text-green-800', icon: 'text-green-500' },
  positive: { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'text-blue-500' },
  neutral: { bg: 'bg-gray-100', text: 'text-gray-800', icon: 'text-gray-500' },
  concerning: { bg: 'bg-red-100', text: 'text-red-800', icon: 'text-red-500' },
}

const severityStyles: Record<string, { bg: string; text: string; label: string }> = {
  blocker: { bg: 'bg-red-50', text: 'text-red-700', label: 'Blocker' },
  yellow_flag: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Yellow Flag' },
  minor: { bg: 'bg-gray-50', text: 'text-gray-600', label: 'Minor' },
}

export function CompanyView({ data }: CompanyViewProps) {
  const tone = toneColors[data.first_impression.tone] || toneColors.neutral

  return (
    <div className="space-y-6 pt-4">
      {/* First Impression */}
      <div className={cn('p-4 rounded-lg', tone.bg)}>
        <div className="flex items-center gap-2 mb-2">
          <svg className={cn('w-5 h-5', tone.icon)} fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path
              fillRule="evenodd"
              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className={cn('text-sm font-medium', tone.text)}>First Impression (10 seconds)</span>
        </div>
        <p className={cn('font-medium', tone.text)}>{data.first_impression.headline}</p>
      </div>

      {/* Perceived Strengths */}
      {data.perceived_strengths.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            What They&apos;ll Like
          </h4>
          <div className="space-y-2">
            {data.perceived_strengths.map((item, idx) => (
              <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="font-medium text-green-900">{item.strength}</p>
                <p className="text-sm text-green-700 mt-1">{item.from_company_pov}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Perceived Weaknesses */}
      {data.perceived_weaknesses.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Potential Concerns
          </h4>
          <div className="space-y-2">
            {data.perceived_weaknesses.map((item, idx) => {
              const severity = severityStyles[item.severity] || severityStyles.minor
              return (
                <div key={idx} className={cn('p-3 rounded-lg border', severity.bg)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded', severity.text, severity.bg)}>
                      {severity.label}
                    </span>
                  </div>
                  <p className={cn('font-medium', severity.text)}>{item.concern}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Likely Objections */}
      {data.likely_objections.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            What They&apos;ll Ask (And How to Respond)
          </h4>
          <div className="space-y-3">
            {data.likely_objections.map((item, idx) => (
              <div key={idx} className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                <p className="font-medium text-orange-900">&quot;{item.objection}&quot;</p>
                <p className="text-sm text-orange-700 mt-2 italic">
                  Their thinking: {item.hiring_manager_thinking}
                </p>
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <p className="text-sm font-medium text-gray-700">Your preemptive response:</p>
                  <p className="text-sm text-gray-600 mt-1">{item.suggested_preempt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
