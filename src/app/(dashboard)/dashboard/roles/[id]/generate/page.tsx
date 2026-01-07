'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type PageProps = {
  params: Promise<{ id: string }>
}

type ResumeConfig = {
  risk_posture: 'safe' | 'balanced' | 'bold'
  tone: 'professional' | 'conversational' | 'technical'
  max_bullets: number
}

type GeneratedResume = {
  professional_summary: string
  experience_bullets: { text: string; impact_level: string }[]
  skills_highlighted: string[]
  tailoring_notes: string
}

export default function GenerateResumePage({ params }: PageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const claimIds = searchParams.get('claims')?.split(',').filter(Boolean) || []

  const [roleId, setRoleId] = useState<string>('')
  const [config, setConfig] = useState<ResumeConfig>({
    risk_posture: 'balanced',
    tone: 'professional',
    max_bullets: 8,
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => setRoleId(p.id))
  }, [params])

  const handleGenerate = async () => {
    if (claimIds.length === 0) {
      toast.error('No claims selected. Go back and select claims first.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId,
          claimIds,
          config,
        }),
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
            {claimIds.length} claim{claimIds.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      </div>

      {!generatedResume ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Generation Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Risk Posture */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Risk Posture
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['safe', 'balanced', 'bold'] as const).map((posture) => (
                    <button
                      key={posture}
                      onClick={() => setConfig({ ...config, risk_posture: posture })}
                      className={`
                        p-3 rounded-lg border-2 text-sm font-medium transition-colors
                        ${config.risk_posture === posture
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="capitalize">{posture}</div>
                      <div className="text-xs font-normal text-gray-500 mt-1">
                        {posture === 'safe' && 'Verified only'}
                        {posture === 'balanced' && 'Medium+ evidence'}
                        {posture === 'bold' && 'All claims'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['professional', 'conversational', 'technical'] as const).map((tone) => (
                    <button
                      key={tone}
                      onClick={() => setConfig({ ...config, tone })}
                      className={`
                        p-3 rounded-lg border-2 text-sm font-medium transition-colors
                        ${config.tone === tone
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="capitalize">{tone}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Bullets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Bullet Points: {config.max_bullets}
                </label>
                <input
                  type="range"
                  min="4"
                  max="12"
                  value={config.max_bullets}
                  onChange={(e) => setConfig({ ...config, max_bullets: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>4 (concise)</span>
                  <span>12 (detailed)</span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || claimIds.length === 0}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  'Generate Resume'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Info */}
          <Card>
            <CardHeader>
              <CardTitle>What You&apos;ll Get</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Professional Summary</p>
                  <p className="text-sm text-gray-500">2-3 sentences capturing your value proposition</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Experience Bullets</p>
                  <p className="text-sm text-gray-500">Achievement-focused, quantified when possible</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Skills Section</p>
                  <p className="text-sm text-gray-500">Relevant skills highlighted for the role</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Generated Resume Preview */
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Generated Resume</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCopyToClipboard}>
                  Copy to Clipboard
                </Button>
                <Button variant="outline" onClick={() => setGeneratedResume(null)}>
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
                <p className="text-gray-900 text-lg">{generatedResume.professional_summary}</p>
              </div>

              {/* Experience Bullets */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Experience
                </h3>
                <ul className="space-y-2">
                  {generatedResume.experience_bullets.map((bullet, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <span className="text-gray-900">{bullet.text}</span>
                      <span className={`
                        px-2 py-0.5 rounded text-xs flex-shrink-0
                        ${bullet.impact_level === 'high' ? 'bg-green-100 text-green-700' :
                          bullet.impact_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'}
                      `}>
                        {bullet.impact_level}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Skills
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
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Tailoring Notes
                </h3>
                <p className="text-sm text-gray-600">{generatedResume.tailoring_notes}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
