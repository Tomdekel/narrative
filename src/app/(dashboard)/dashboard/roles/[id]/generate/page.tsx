'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type PageProps = {
  params: Promise<{ id: string }>
}

type GeneratedResume = {
  professional_summary: string
  experience_bullets: { text: string; impact_level: string }[]
  skills_highlighted: string[]
  tailoring_notes: string
}

export default function GenerateResumePage({ params }: PageProps) {
  const router = useRouter()
  const [roleId, setRoleId] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revisionRequest, setRevisionRequest] = useState('')
  const [isRevising, setIsRevising] = useState(false)

  useEffect(() => {
    params.then(p => setRoleId(p.id))
  }, [params])

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate resume')
      }

      const data = await response.json()
      setGeneratedResume(data)
      toast.success('Resume generated successfully!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate resume'
      setError(message)
      toast.error(message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRevision = async () => {
    if (!revisionRequest.trim() || !generatedResume) return

    setIsRevising(true)
    try {
      const response = await fetch('/api/resume/revise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId,
          currentResume: generatedResume,
          revisionRequest: revisionRequest.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to revise resume')
      }

      const data = await response.json()
      setGeneratedResume(data)
      setRevisionRequest('')
      toast.success('Resume revised!')
    } catch (err) {
      toast.error('Failed to revise resume')
    } finally {
      setIsRevising(false)
    }
  }

  const handleCopyToClipboard = async () => {
    if (!generatedResume) return

    const text = `
PROFESSIONAL SUMMARY
${generatedResume.professional_summary}

EXPERIENCE
${generatedResume.experience_bullets.map(b => `• ${b.text}`).join('\n')}

SKILLS
${generatedResume.skills_highlighted.join(' • ')}
`.trim()

    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  // Auto-generate on mount if no resume yet
  useEffect(() => {
    if (roleId && !generatedResume && !isGenerating && !error) {
      handleGenerate()
    }
  }, [roleId])

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Link href={`/dashboard/roles/${roleId}`} className="text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Generate Resume</h1>
          <p className="text-gray-500 mt-1">
            Tailored for this specific role
          </p>
        </div>
      </div>

      {isGenerating && !generatedResume ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center gap-4">
              <svg className="animate-spin h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900">Generating your tailored resume...</p>
                <p className="text-gray-500 mt-1">This may take 15-30 seconds</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : error && !generatedResume ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={handleGenerate}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      ) : generatedResume ? (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Generated Resume</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCopyToClipboard}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </Button>
                <Button variant="outline" onClick={() => { setGeneratedResume(null); handleGenerate() }}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Professional Summary */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Professional Summary
                </h3>
                <p className="text-gray-900 text-lg leading-relaxed">{generatedResume.professional_summary}</p>
              </div>

              {/* Experience Bullets */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Experience Highlights
                </h3>
                <ul className="space-y-2">
                  {generatedResume.experience_bullets.map((bullet, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span className="text-gray-900">{bullet.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Key Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {generatedResume.skills_highlighted.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tailoring Notes */}
              <div className="pt-4 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Why this works for the role
                </h3>
                <p className="text-sm text-gray-600">{generatedResume.tailoring_notes}</p>
              </div>
            </CardContent>
          </Card>

          {/* Revision Chat */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Request Revisions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <textarea
                  value={revisionRequest}
                  onChange={(e) => setRevisionRequest(e.target.value)}
                  placeholder="E.g., 'Make the summary more focused on leadership' or 'Add more quantified metrics' or 'Make it more concise'"
                  className="w-full p-3 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleRevision}
                    disabled={isRevising || !revisionRequest.trim()}
                  >
                    {isRevising ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Revising...
                      </>
                    ) : (
                      'Apply Revision'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
