'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type ProcessingStep = {
  id: string
  label: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

function ProcessingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const artifactIds = searchParams.get('ids')?.split(',').filter(Boolean) || []

  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: 'upload', label: 'Documents uploaded', status: 'completed' },
    { id: 'extract', label: 'Extracting text', status: 'processing' },
    { id: 'analyze', label: 'Analyzing career patterns', status: 'pending' },
    { id: 'insights', label: 'Identifying key insights', status: 'pending' },
  ])
  const [isComplete, setIsComplete] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (artifactIds.length === 0) {
      router.push('/dashboard/story')
      return
    }

    const supabase = createClient()
    let pollCount = 0
    const maxPolls = 60 // 2 minutes max

    const checkStatus = async () => {
      try {
        // Check status of all artifacts
        const { data: artifacts, error } = await supabase
          .from('artifacts')
          .select('id, status')
          .in('id', artifactIds)

        if (error) throw error

        const allProcessing = artifacts?.every(a => a.status === 'processing') ?? false
        const allCompleted = artifacts?.every(a => a.status === 'completed') ?? false
        const anyFailed = artifacts?.some(a => a.status === 'failed') ?? false
        const anyExtracted = artifacts?.some(a => a.status === 'completed') ?? false

        // Update steps based on status
        if (anyFailed) {
          setHasError(true)
          setSteps(prev => prev.map(s => ({
            ...s,
            status: s.id === 'upload' ? 'completed' : s.id === 'extract' ? 'failed' : 'pending'
          })))
          return
        }

        if (anyExtracted) {
          setSteps(prev => prev.map(s => {
            if (s.id === 'upload') return { ...s, status: 'completed' }
            if (s.id === 'extract') return { ...s, status: allCompleted ? 'completed' : 'processing' }
            if (s.id === 'analyze') return { ...s, status: allCompleted ? 'completed' : 'processing' }
            if (s.id === 'insights') return { ...s, status: allCompleted ? 'completed' : 'pending' }
            return s
          }))
        }

        // Check for claims
        if (allCompleted) {
          const { data: claims } = await supabase
            .from('claims')
            .select('id')
            .in('source_artifact_id', artifactIds)
            .limit(1)

          if (claims && claims.length > 0) {
            setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })))
            setIsComplete(true)
            // Auto-redirect after short delay
            setTimeout(() => {
              router.push('/dashboard/insights')
            }, 1500)
            return
          }
        }

        // Continue polling
        pollCount++
        if (pollCount < maxPolls && !isComplete) {
          setTimeout(checkStatus, 2000)
        }
      } catch (err) {
        console.error('Status check error:', err)
        setHasError(true)
      }
    }

    checkStatus()
  }, [artifactIds, router, isComplete])

  const getStatusIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'processing':
        return (
          <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )
      case 'failed':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {isComplete ? 'All Done!' : 'Processing Your Story...'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isComplete
            ? 'Your career insights are ready to review'
            : `Analyzing ${artifactIds.length} document${artifactIds.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-4">
                <div className="flex-shrink-0">{getStatusIcon(step.status)}</div>
                <div className="flex-1">
                  <p className={`font-medium ${step.status === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>
                    {step.label}
                  </p>
                </div>
                {step.status === 'completed' && (
                  <span className="text-xs text-green-600">Complete</span>
                )}
                {step.status === 'processing' && (
                  <span className="text-xs text-blue-600">In progress</span>
                )}
                {step.status === 'failed' && (
                  <span className="text-xs text-red-600">Failed</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {hasError && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-700 text-sm">
              Something went wrong during processing. Please try uploading your documents again.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/story')}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {!isComplete && !hasError && (
        <p className="text-center text-sm text-gray-500">
          This usually takes 1-2 minutes. You&apos;ll be automatically redirected when ready.
        </p>
      )}

      {isComplete && (
        <div className="flex justify-center">
          <Link href="/dashboard/insights">
            <Button size="lg">
              View Career Insights
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={
      <div className="max-w-xl mx-auto text-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <ProcessingContent />
    </Suspense>
  )
}
