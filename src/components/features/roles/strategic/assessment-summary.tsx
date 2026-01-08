'use client'

import type { HardTruths } from '@/server/services/resume-pipeline/types'
import { cn } from '@/lib/utils'

interface AssessmentSummaryProps {
  hardTruths: HardTruths
}

const recommendationLabels: Record<string, { label: string; color: string }> = {
  strong_apply: { label: 'Strong Apply', color: 'text-green-700 bg-green-100' },
  apply_with_strategy: { label: 'Apply with Strategy', color: 'text-yellow-700 bg-yellow-100' },
  stretch_apply: { label: 'Stretch Apply', color: 'text-orange-700 bg-orange-100' },
  consider_alternatives: { label: 'Consider Alternatives', color: 'text-red-700 bg-red-100' },
}

const probabilityLabels: Record<string, { label: string; color: string }> = {
  high: { label: 'High', color: 'text-green-600' },
  medium: { label: 'Medium', color: 'text-yellow-600' },
  low: { label: 'Low', color: 'text-red-600' },
}

export function AssessmentSummary({ hardTruths }: AssessmentSummaryProps) {
  const { net_fit_assessment } = hardTruths
  const recommendation = recommendationLabels[net_fit_assessment.recommendation] || {
    label: net_fit_assessment.recommendation,
    color: 'text-gray-700 bg-gray-100',
  }
  const probability = probabilityLabels[net_fit_assessment.success_probability] || {
    label: net_fit_assessment.success_probability,
    color: 'text-gray-600',
  }

  return (
    <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-6 border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Net Assessment</p>
          <span
            className={cn(
              'inline-block px-3 py-1 rounded-full text-sm font-medium',
              recommendation.color
            )}
          >
            {recommendation.label}
          </span>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 mb-1">Success Probability</p>
          <span className={cn('text-lg font-semibold', probability.color)}>
            {probability.label}
          </span>
        </div>
      </div>
      <p className="mt-4 text-gray-700 text-sm leading-relaxed border-t border-slate-200 pt-4">
        {net_fit_assessment.honest_take}
      </p>
    </div>
  )
}
