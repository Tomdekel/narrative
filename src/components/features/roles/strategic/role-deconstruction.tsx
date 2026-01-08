'use client'

import type { RoleDeconstruction as RoleDeconstructionType } from '@/server/services/resume-pipeline/types'
import { cn } from '@/lib/utils'

interface RoleDeconstructionProps {
  data: RoleDeconstructionType
}

const signalColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  important: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  nice_to_have: 'bg-gray-100 text-gray-700 border-gray-200',
}

export function RoleDeconstruction({ data }: RoleDeconstructionProps) {
  return (
    <div className="space-y-6 pt-4">
      {/* Actual Priorities */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">What They Actually Need</h4>
        <div className="space-y-2">
          {data.actual_priorities.map((priority, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded border shrink-0',
                  signalColors[priority.signal_strength]
                )}
              >
                {priority.signal_strength.replace('_', ' ')}
              </span>
              <div>
                <p className="font-medium text-gray-900">{priority.requirement}</p>
                <p className="text-sm text-gray-600 mt-1">{priority.why_it_matters}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Marketing vs Reality */}
      {data.marketing_vs_reality.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Reading Between the Lines</h4>
          <div className="space-y-2">
            {data.marketing_vs_reality.map((item, idx) => (
              <div key={idx} className="p-3 bg-white rounded-lg border">
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 text-sm shrink-0">JD says:</span>
                  <p className="text-gray-600 text-sm">&quot;{item.stated}&quot;</p>
                </div>
                <div className="flex items-start gap-2 mt-2">
                  <span className="text-blue-600 text-sm shrink-0">Means:</span>
                  <p className="text-gray-900 text-sm font-medium">{item.actual_meaning}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hiring Signals */}
      {data.hiring_signals.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Hidden Signals</h4>
          <div className="space-y-2">
            {data.hiring_signals.map((signal, idx) => (
              <div key={idx} className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="font-medium text-amber-900">{signal.signal}</p>
                <p className="text-sm text-amber-700 mt-1">
                  Evidence: {signal.evidence_from_jd}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
