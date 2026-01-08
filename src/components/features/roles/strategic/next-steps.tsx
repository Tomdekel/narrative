'use client'

import type { NextSteps as NextStepsType } from '@/server/services/resume-pipeline/types'

interface NextStepsProps {
  data: NextStepsType
}

export function NextSteps({ data }: NextStepsProps) {
  return (
    <div className="space-y-6 pt-4">
      {/* Before Applying */}
      {data.before_applying.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Before You Apply
          </h4>
          <div className="space-y-2">
            {data.before_applying.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-purple-200 text-purple-700 rounded-full text-sm font-medium">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-medium text-purple-900">{item.action}</p>
                  <p className="text-sm text-purple-700 mt-1">{item.why}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stories to Prepare */}
      {data.stories_to_prepare.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Stories to Prepare for Interviews
          </h4>
          <div className="space-y-2">
            {data.stories_to_prepare.map((item, idx) => (
              <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                  {item.interview_question_type}
                </span>
                <p className="font-medium text-blue-900 mt-1">{item.story_prompt}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positioning Advice */}
      {data.positioning_advice.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Positioning Tips
          </h4>
          <div className="space-y-2">
            {data.positioning_advice.map((item, idx) => (
              <div key={idx} className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="font-medium text-amber-900">{item.advice}</p>
                <p className="text-sm text-amber-700 mt-1">{item.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
