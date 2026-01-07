'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type PageProps = {
  params: Promise<{ id: string }>
}

type Experience = {
  company: string
  title: string
  original_title?: string
  start_date: string
  end_date: string
  location?: string
  achievements: string[]
}

type Education = {
  institution: string
  degree: string
  field?: string
  year: string
  honors?: string
}

type SkillCategory = {
  category: string
  items: string[]
}

type GeneratedResume = {
  contact: {
    name: string
    headline?: string
    email?: string
    phone?: string
    location?: string
    linkedin?: string
  }
  summary: string
  experience: Experience[]
  education: Education[]
  skills: SkillCategory[]
  certifications?: { name: string; issuer?: string; year?: string }[]
  metadata: {
    tailoring_notes: string
    narrative_angle: string
  }
}

type ApiResponse = {
  success: boolean
  resume: GeneratedResume
  debug?: {
    cvStructure: { experienceCount: number; educationCount: number }
    claimsAttributed: number
    narrativeAngle: string
  }
}

export default function GenerateResumePage({ params }: PageProps) {
  const [roleId, setRoleId] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revisionRequest, setRevisionRequest] = useState('')
  const [isRevising, setIsRevising] = useState(false)
  const [generationStep, setGenerationStep] = useState<string>('')

  useEffect(() => {
    params.then(p => setRoleId(p.id))
  }, [params])

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    setGenerationStep('Parsing CV structure...')

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

      const data: ApiResponse = await response.json()
      setGeneratedResume(data.resume)
      toast.success('Resume generated successfully!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate resume'
      setError(message)
      toast.error(message)
    } finally {
      setIsGenerating(false)
      setGenerationStep('')
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
      if (data.resume) {
        setGeneratedResume(data.resume)
      }
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

    const { contact, summary, experience, education, skills, certifications } = generatedResume

    let text = `${contact.name}\n`
    if (contact.headline) text += `${contact.headline}\n`

    const contactParts = []
    if (contact.email) contactParts.push(contact.email)
    if (contact.phone) contactParts.push(contact.phone)
    if (contact.location) contactParts.push(contact.location)
    if (contact.linkedin) contactParts.push(contact.linkedin)
    if (contactParts.length) text += `${contactParts.join(' | ')}\n`

    text += `\n---\n\nSUMMARY\n${summary}\n`

    text += `\n---\n\nEXPERIENCE\n`
    for (const job of experience) {
      text += `\n${job.company}\n`
      text += `${job.title} | ${job.start_date} - ${job.end_date}\n`
      if (job.location) text += `${job.location}\n`
      for (const achievement of job.achievements) {
        text += `• ${achievement}\n`
      }
    }

    text += `\n---\n\nEDUCATION\n`
    for (const edu of education) {
      text += `${edu.institution}\n`
      text += `${edu.degree}${edu.field ? ` in ${edu.field}` : ''}, ${edu.year}`
      if (edu.honors) text += ` (${edu.honors})`
      text += '\n'
    }

    text += `\n---\n\nSKILLS\n`
    for (const cat of skills) {
      text += `${cat.category}: ${cat.items.join(', ')}\n`
    }

    if (certifications?.length) {
      text += `\n---\n\nCERTIFICATIONS\n`
      for (const cert of certifications) {
        text += `${cert.name}${cert.issuer ? ` (${cert.issuer})` : ''}${cert.year ? `, ${cert.year}` : ''}\n`
      }
    }

    try {
      await navigator.clipboard.writeText(text.trim())
      toast.success('Copied to clipboard!')
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  // Auto-generate on mount
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
          <h1 className="text-3xl font-bold text-gray-900">Generated Resume</h1>
          <p className="text-gray-500 mt-1">Tailored for this specific role</p>
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
                <p className="text-gray-500 mt-1">{generationStep || 'This may take 20-40 seconds'}</p>
                <div className="flex justify-center gap-2 mt-4 text-xs text-gray-400">
                  <span>Parsing CV</span>
                  <span>→</span>
                  <span>Matching claims</span>
                  <span>→</span>
                  <span>Analyzing fit</span>
                  <span>→</span>
                  <span>Composing</span>
                </div>
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
          {/* Actions Bar */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {generatedResume.metadata.narrative_angle}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCopyToClipboard}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Text
              </Button>
              <Button variant="outline" onClick={() => { setGeneratedResume(null); handleGenerate() }}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate
              </Button>
            </div>
          </div>

          {/* Resume Display */}
          <Card className="bg-white shadow-lg">
            <CardContent className="p-8 space-y-8 font-serif">
              {/* Header */}
              <div className="text-center border-b pb-6">
                <h2 className="text-2xl font-bold text-gray-900 tracking-wide">
                  {generatedResume.contact.name}
                </h2>
                {generatedResume.contact.headline && (
                  <p className="text-gray-600 mt-1">{generatedResume.contact.headline}</p>
                )}
                <div className="flex flex-wrap justify-center gap-3 mt-3 text-sm text-gray-500">
                  {generatedResume.contact.email && (
                    <span>{generatedResume.contact.email}</span>
                  )}
                  {generatedResume.contact.phone && (
                    <span>• {generatedResume.contact.phone}</span>
                  )}
                  {generatedResume.contact.location && (
                    <span>• {generatedResume.contact.location}</span>
                  )}
                  {generatedResume.contact.linkedin && (
                    <span>• {generatedResume.contact.linkedin}</span>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 border-b pb-1">
                  Summary
                </h3>
                <p className="text-gray-700 leading-relaxed">{generatedResume.summary}</p>
              </div>

              {/* Experience */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-1">
                  Experience
                </h3>
                <div className="space-y-6">
                  {generatedResume.experience.map((job, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-baseline">
                        <div>
                          <h4 className="font-bold text-gray-900">{job.company}</h4>
                          <p className="text-gray-700">
                            {job.title}
                            {job.original_title && job.original_title !== job.title && (
                              <span className="text-gray-400 text-sm ml-2">
                                (originally: {job.original_title})
                              </span>
                            )}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                          {job.start_date} - {job.end_date}
                        </span>
                      </div>
                      {job.location && (
                        <p className="text-sm text-gray-500">{job.location}</p>
                      )}
                      <ul className="mt-2 space-y-1">
                        {job.achievements.map((achievement, aIdx) => (
                          <li key={aIdx} className="text-gray-700 text-sm flex">
                            <span className="mr-2">•</span>
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 border-b pb-1">
                  Education
                </h3>
                <div className="space-y-2">
                  {generatedResume.education.map((edu, idx) => (
                    <div key={idx} className="flex justify-between">
                      <div>
                        <span className="font-medium text-gray-900">{edu.institution}</span>
                        <span className="text-gray-700">
                          {' — '}{edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                          {edu.honors && <span className="text-gray-500"> ({edu.honors})</span>}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{edu.year}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 border-b pb-1">
                  Skills
                </h3>
                <div className="space-y-2">
                  {generatedResume.skills.map((cat, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-medium text-gray-800">{cat.category}:</span>{' '}
                      <span className="text-gray-700">{cat.items.join(' • ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              {generatedResume.certifications && generatedResume.certifications.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 border-b pb-1">
                    Certifications
                  </h3>
                  <div className="space-y-1">
                    {generatedResume.certifications.map((cert, idx) => (
                      <p key={idx} className="text-sm text-gray-700">
                        {cert.name}
                        {cert.issuer && <span className="text-gray-500"> — {cert.issuer}</span>}
                        {cert.year && <span className="text-gray-500"> ({cert.year})</span>}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tailoring Notes */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-1">Why This Works</h4>
              <p className="text-sm text-blue-700">{generatedResume.metadata.tailoring_notes}</p>
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
                  placeholder="E.g., 'Make the summary more focused on leadership' or 'Add more quantified metrics' or 'Emphasize the AI/ML experience more'"
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
