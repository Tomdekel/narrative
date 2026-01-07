'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { toast } from 'sonner'

type FitAnalysis = {
  strong_fit: {
    requirement: string
    evidence_claims: string[]
    reasoning: string
  }[]
  loose_fit: {
    requirement: string
    partial_match: string
    reasoning: string
  }[]
  stretch: {
    requirement: string
    adjacent_experience: string
    reasoning: string
  }[]
  gaps: {
    requirement: string
    suggestion: string
  }[]
}

interface HowYouFitProps {
  roleId: string
  initialAnalysis?: FitAnalysis | null
  userCorrections?: string | null
}

export function HowYouFit({ roleId, initialAnalysis, userCorrections: initialCorrections }: HowYouFitProps) {
  const [analysis, setAnalysis] = useState<FitAnalysis | null>(initialAnalysis || null)
  const [isLoading, setIsLoading] = useState(!initialAnalysis)
  const [corrections, setCorrections] = useState(initialCorrections || '')
  const [showCorrectionBox, setShowCorrectionBox] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!initialAnalysis) {
      fetchAnalysis()
    }
  }, [roleId, initialAnalysis])

  const fetchAnalysis = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/fit-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleIntentId: roleId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze fit')
      }

      setAnalysis(data.analysis)
    } catch (error) {
      console.error('Fit analysis error:', error)
      toast.error('Failed to analyze fit')
    } finally {
      setIsLoading(false)
    }
  }

  const saveCorrections = async () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/roles/${roleId}/corrections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ corrections }),
        })

        if (!response.ok) {
          throw new Error('Failed to save corrections')
        }

        toast.success('Corrections saved')
        setShowCorrectionBox(false)

        // Optionally re-run analysis
        fetchAnalysis()
      } catch (error) {
        toast.error('Failed to save corrections')
      }
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-gray-600">Analyzing your fit for this role...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-600">
            <p>Unable to analyze fit. Please try again.</p>
            <Button variant="outline" className="mt-4" onClick={fetchAnalysis}>
              Retry Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalStrong = analysis.strong_fit.length
  const totalLoose = analysis.loose_fit.length
  const totalStretch = analysis.stretch.length
  const totalGaps = analysis.gaps.length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">How You Fit This Role</CardTitle>
          <Link href={`/dashboard/roles/${roleId}/generate`}>
            <Button>
              Generate Tailored Resume
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Strong Fit */}
        {totalStrong > 0 && (
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-green-700 mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Strong Fit ({totalStrong})
            </h3>
            <div className="space-y-3 pl-7">
              {analysis.strong_fit.slice(0, 5).map((item, index) => (
                <div key={index} className="p-3 bg-green-50 rounded-lg">
                  <p className="font-medium text-green-900">{item.requirement}</p>
                  <p className="text-sm text-green-700 mt-1">{item.reasoning}</p>
                  {item.evidence_claims.length > 0 && (
                    <p className="text-xs text-green-600 mt-2">
                      Evidence: {item.evidence_claims.slice(0, 2).join(', ')}
                    </p>
                  )}
                </div>
              ))}
              {totalStrong > 5 && (
                <p className="text-xs text-gray-500">+{totalStrong - 5} more strong matches</p>
              )}
            </div>
          </div>
        )}

        {/* Loose Fit */}
        {totalLoose > 0 && (
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-yellow-700 mb-3">
              <span className="text-yellow-500 text-lg">~</span>
              Loose Fit ({totalLoose})
            </h3>
            <div className="space-y-3 pl-7">
              {analysis.loose_fit.slice(0, 3).map((item, index) => (
                <div key={index} className="p-3 bg-yellow-50 rounded-lg">
                  <p className="font-medium text-yellow-900">{item.requirement}</p>
                  <p className="text-sm text-yellow-700 mt-1">{item.reasoning}</p>
                  <p className="text-xs text-yellow-600 mt-1">Related: {item.partial_match}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stretch */}
        {totalStretch > 0 && (
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-orange-700 mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Stretch ({totalStretch})
            </h3>
            <div className="space-y-3 pl-7">
              {analysis.stretch.slice(0, 3).map((item, index) => (
                <div key={index} className="p-3 bg-orange-50 rounded-lg">
                  <p className="font-medium text-orange-900">{item.requirement}</p>
                  <p className="text-sm text-orange-700 mt-1">{item.reasoning}</p>
                  <p className="text-xs text-orange-600 mt-1">Transferable: {item.adjacent_experience}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gaps */}
        {totalGaps > 0 && (
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-red-700 mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Gaps to Address ({totalGaps})
            </h3>
            <div className="space-y-3 pl-7">
              {analysis.gaps.map((item, index) => (
                <div key={index} className="p-3 bg-red-50 rounded-lg">
                  <p className="font-medium text-red-900">{item.requirement}</p>
                  <p className="text-sm text-red-700 mt-1 italic">{item.suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-green-600 font-medium">{totalStrong} strong</span>
              <span className="text-yellow-600 font-medium">{totalLoose} loose</span>
              <span className="text-orange-600 font-medium">{totalStretch} stretch</span>
              <span className="text-red-600 font-medium">{totalGaps} gaps</span>
            </div>
            <button
              onClick={() => setShowCorrectionBox(!showCorrectionBox)}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              {showCorrectionBox ? 'Hide corrections' : 'Something wrong?'}
            </button>
          </div>
        </div>

        {/* Correction Box */}
        {showCorrectionBox && (
          <div className="pt-4 border-t">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Anything we got wrong?
                </label>
                <textarea
                  value={corrections}
                  onChange={(e) => setCorrections(e.target.value)}
                  placeholder="E.g., 'I do have 5 years of product management experience from my time at Company X' or 'My Python experience is stronger than shown - I built the entire data pipeline'"
                  className="w-full p-3 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your corrections will be used to improve the fit analysis and resume generation
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCorrectionBox(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={saveCorrections}
                  disabled={isPending || !corrections.trim()}
                >
                  {isPending ? 'Saving...' : 'Save & Re-analyze'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
