'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'

type Props = {
  artifactId: string
  initialStatus: string
}

const steps = [
  { key: 'pending', label: 'Queued', description: 'Waiting to be processed' },
  { key: 'extract_text', label: 'Extracting Text', description: 'Reading document content' },
  { key: 'generate_embeddings', label: 'Generating Embeddings', description: 'Creating semantic vectors' },
  { key: 'extract_claims', label: 'Extracting Claims', description: 'Identifying career claims' },
  { key: 'ready', label: 'Complete', description: 'Processing finished' },
]

export function ProcessingStatus({ artifactId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus)
  const [currentStep, setCurrentStep] = useState(initialStatus)
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to artifact changes
    const channel = supabase
      .channel(`artifact-${artifactId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'artifacts',
          filter: `id=eq.${artifactId}`,
        },
        (payload) => {
          setStatus(payload.new.status)
          if (payload.new.status === 'ready') {
            window.location.reload()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'processing_jobs',
          filter: `entity_id=eq.${artifactId}`,
        },
        (payload) => {
          const newRecord = payload.new as { job_type?: string } | null
          if (newRecord?.job_type) {
            setCurrentStep(newRecord.job_type)
          }
        }
      )
      .subscribe()

    // Poll for updates as backup
    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from('artifacts')
        .select('status')
        .eq('id', artifactId)
        .single()

      if (data && data.status !== status) {
        setStatus(data.status)
        if (data.status === 'ready') {
          window.location.reload()
        }
      }
    }, 5000)

    return () => {
      channel.unsubscribe()
      clearInterval(pollInterval)
    }
  }, [artifactId, status, supabase])

  const getCurrentStepIndex = () => {
    if (status === 'ready') return steps.length - 1
    if (status === 'failed') return -1
    return steps.findIndex((s) => s.key === currentStep) || 0
  }

  const stepIndex = getCurrentStepIndex()

  if (status === 'failed') {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-red-900">Processing Failed</h3>
              <p className="text-sm text-red-700">
                There was an error processing your document. Please try again.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Processing Document</h3>
            <p className="text-sm text-gray-500">This may take a few minutes...</p>
          </div>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => {
            const isComplete = index < stepIndex
            const isCurrent = index === stepIndex
            const isPending = index > stepIndex

            return (
              <div key={step.key} className="flex items-center gap-3">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium
                    ${isComplete ? 'bg-green-100 text-green-600' : ''}
                    ${isCurrent ? 'bg-blue-100 text-blue-600' : ''}
                    ${isPending ? 'bg-gray-100 text-gray-400' : ''}
                  `}
                >
                  {isComplete ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isPending ? 'text-gray-400' : 'text-gray-900'}`}>
                    {step.label}
                  </p>
                  <p className={`text-xs ${isPending ? 'text-gray-300' : 'text-gray-500'}`}>
                    {step.description}
                  </p>
                </div>
                {isCurrent && (
                  <div className="w-4 h-4">
                    <svg className="animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
