'use client'

import type { SignalStrategy as SignalStrategyType } from '@/server/services/resume-pipeline/types'

interface SignalStrategyProps {
  data: SignalStrategyType
}

export function SignalStrategy({ data }: SignalStrategyProps) {
  return (
    <div className="space-y-6 pt-4">
      {/* Narrative Angle */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Your Positioning Story
        </h4>
        <p className="text-blue-900 font-medium">{data.narrative_angle.primary_story}</p>
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Lead with:</span> {data.narrative_angle.opens_with}
          </p>
        </div>
      </div>

      {/* Signals to Amplify */}
      {data.signals_to_amplify.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
            </svg>
            Amplify These Signals
          </h4>
          <div className="space-y-2">
            {data.signals_to_amplify.map((item, idx) => (
              <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="font-medium text-green-900">{item.signal}</p>
                <p className="text-sm text-green-700 mt-1">{item.how_to_amplify}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signals to Downplay */}
      {data.signals_to_downplay.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Downplay or Reframe
          </h4>
          <div className="space-y-2">
            {data.signals_to_downplay.map((item, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-medium text-gray-900">{item.signal}</p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Reframe as:</span> {item.how_to_reframe}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
