'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { StrategicAssessment as StrategicAssessmentType } from '@/server/services/resume-pipeline/types'
import { AssessmentSummary } from './strategic/assessment-summary'
import { RoleDeconstruction } from './strategic/role-deconstruction'
import { CompanyView } from './strategic/company-view'
import { HardTruths } from './strategic/hard-truths'
import { SignalStrategy } from './strategic/signal-strategy'
import { NextSteps } from './strategic/next-steps'
import { ExpandableSection } from './strategic/expandable-section'

interface StrategicAssessmentProps {
  roleId: string
  initialAssessment?: StrategicAssessmentType | null
}

export function StrategicAssessment({ roleId, initialAssessment }: StrategicAssessmentProps) {
  const [assessment, setAssessment] = useState<StrategicAssessmentType | null>(initialAssessment || null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasAttempted, setHasAttempted] = useState(!!initialAssessment)

  const fetchAssessment = async (forceRefresh = false) => {
    setIsLoading(true)
    setHasAttempted(true)
    try {
      const response = await fetch('/api/strategic-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId, forceRefresh }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate strategic assessment')
      }

      setAssessment(data.assessment)
      if (data.cached) {
        toast.success('Loaded cached analysis')
      } else {
        toast.success('Strategic analysis complete')
      }
    } catch (error) {
      console.error('Strategic assessment error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate assessment')
    } finally {
      setIsLoading(false)
    }
  }

  // If no initial assessment and user explicitly clicks, we'll load it
  // Otherwise, show the CTA to generate

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <svg className="animate-spin h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <div className="text-center">
              <p className="text-gray-900 font-medium">Generating Strategic Analysis...</p>
              <p className="text-gray-500 text-sm mt-1">
                This takes 15-30 seconds. Our AI is analyzing the role from a hiring manager&apos;s perspective.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!assessment) {
    return (
      <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-blue-200">
        <CardContent className="py-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Strategic Career Analysis</h3>
            <p className="text-gray-600 text-sm max-w-md mx-auto mb-6">
              Get brutally honest insights from a hiring manager&apos;s perspective: what they&apos;ll really think,
              likely objections, and exactly how to position yourself for this role.
            </p>
            <Button onClick={() => fetchAssessment()} size="lg">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Strategic Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Strategic Career Analysis
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => fetchAssessment(true)}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Always-visible Summary */}
        <AssessmentSummary hardTruths={assessment.hard_truths} />

        {/* Expandable Sections */}
        <div className="space-y-3">
          <ExpandableSection
            title="What This Role Actually Wants"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            defaultOpen={true}
          >
            <RoleDeconstruction data={assessment.role_deconstruction} />
          </ExpandableSection>

          <ExpandableSection
            title="How They'll See You"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
            defaultOpen={true}
          >
            <CompanyView data={assessment.company_view} />
          </ExpandableSection>

          <ExpandableSection
            title="Hard Truths"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
            defaultOpen={false}
          >
            <HardTruths data={assessment.hard_truths} />
          </ExpandableSection>

          <ExpandableSection
            title="Your Positioning Strategy"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
            defaultOpen={true}
          >
            <SignalStrategy data={assessment.signal_strategy} />
          </ExpandableSection>

          <ExpandableSection
            title="Before You Apply"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
            defaultOpen={true}
          >
            <NextSteps data={assessment.next_steps} />
          </ExpandableSection>
        </div>
      </CardContent>
    </Card>
  )
}
