'use client'

import { cn } from '@/lib/utils'

type Step = {
  id: string
  label: string
  href: string
  completed: boolean
  current?: boolean
}

interface ProgressStepperProps {
  steps: Step[]
}

export function ProgressStepper({ steps }: ProgressStepperProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1">
          {/* Step circle and label */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                step.completed
                  ? 'bg-green-500 text-white'
                  : step.current
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              )}
            >
              {step.completed ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <span
              className={cn(
                'mt-2 text-xs font-medium text-center max-w-[80px]',
                step.completed || step.current ? 'text-gray-900' : 'text-gray-400'
              )}
            >
              {step.label}
            </span>
          </div>

          {/* Connector line */}
          {index < steps.length - 1 && (
            <div className="flex-1 h-0.5 mx-2 mt-[-20px]">
              <div
                className={cn(
                  'h-full transition-colors',
                  step.completed ? 'bg-green-500' : 'bg-gray-200'
                )}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
