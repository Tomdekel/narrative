'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createRoleIntent } from '@/server/actions/roles'

export default function NewRolePage() {
  const router = useRouter()
  const [jobUrl, setJobUrl] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFetchUrl = async () => {
    if (!jobUrl.trim()) {
      toast.error('Please enter a URL')
      return
    }

    // Validate URL format
    try {
      new URL(jobUrl)
    } catch {
      toast.error('Please enter a valid URL')
      return
    }

    setIsFetching(true)
    setError(null)

    try {
      const response = await fetch('/api/jd-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch job description')
      }

      setJobDescription(data.jobDescription)
      toast.success('Job description extracted!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch URL'
      setError(message)
      toast.error(message)
    } finally {
      setIsFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!jobDescription.trim()) {
      toast.error('Please paste a job description or fetch from URL')
      return
    }

    setIsProcessing(true)
    setError(null)

    const result = await createRoleIntent(jobDescription, roleTitle || undefined)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
      setIsProcessing(false)
      return
    }

    if (result.roleIntentId) {
      toast.success('Role analyzed successfully!')
      router.push(`/dashboard/roles/${result.roleIntentId}`)
    }
  }

  const isLoading = isProcessing || isFetching

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/roles" className="text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Target Role</h1>
          <p className="text-gray-500 mt-1">
            Paste a job description or enter a URL
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="roleTitle" className="block text-sm font-medium text-gray-700 mb-1">
                Role Title (optional)
              </label>
              <input
                type="text"
                id="roleTitle"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to auto-extract from the job description
              </p>
            </div>

            {/* URL Input */}
            <div>
              <label htmlFor="jobUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Job Posting URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  id="jobUrl"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://linkedin.com/jobs/... or any job posting URL"
                  className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFetchUrl}
                  disabled={isLoading || !jobUrl.trim()}
                >
                  {isFetching ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Fetching...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Fetch
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter a job posting URL and click Fetch to auto-extract the description
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or paste directly</span>
              </div>
            </div>

            <div>
              <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Job Description *
              </label>
              <textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
                rows={15}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                {jobDescription.length} characters
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900">What happens next?</p>
                <p className="mt-1">
                  AI will analyze the job description to extract key requirements,
                  implicit signals, and match them against your career insights.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading || !jobDescription.trim()}>
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </>
            ) : (
              'Analyze Job Description'
            )}
          </Button>
          <Link href="/dashboard/roles">
            <Button variant="outline" type="button" disabled={isLoading}>
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
