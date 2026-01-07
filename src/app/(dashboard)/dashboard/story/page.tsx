'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type UploadedFile = {
  file: File
  id: string
}

export default function StoryPage() {
  const router = useRouter()
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [supportingFiles, setSupportingFiles] = useState<UploadedFile[]>([])
  const [careerContext, setCareerContext] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allowedTypes = [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  const maxSize = 10 * 1024 * 1024 // 10MB

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a PDF, TXT, DOC, or DOCX file'
    }
    if (file.size > maxSize) {
      return 'File size must be less than 10MB'
    }
    return null
  }

  const handleCvDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      const error = validateFile(file)
      if (error) {
        setError(error)
        return
      }
      setCvFile(file)
      setError(null)
    }
  }, [])

  const handleCvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const error = validateFile(file)
      if (error) {
        setError(error)
        return
      }
      setCvFile(file)
      setError(null)
    }
  }

  const handleSupportingDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    addSupportingFiles(files)
  }, [])

  const handleSupportingSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    addSupportingFiles(files)
  }

  const addSupportingFiles = (files: File[]) => {
    const validFiles: UploadedFile[] = []
    for (const file of files) {
      const error = validateFile(file)
      if (error) {
        toast.error(`${file.name}: ${error}`)
        continue
      }
      validFiles.push({ file, id: Math.random().toString(36).substring(7) })
    }
    setSupportingFiles(prev => [...prev, ...validFiles])
  }

  const removeSupportingFile = (id: string) => {
    setSupportingFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleSubmit = async () => {
    if (!cvFile) {
      setError('Please upload your CV first')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Upload all files
      const allFiles = [cvFile, ...supportingFiles.map(f => f.file)]
      const uploadedArtifactIds: string[] = []

      for (const file of allFiles) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/artifacts/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || `Failed to upload ${file.name}`)
        }

        const data = await response.json()
        uploadedArtifactIds.push(data.artifactId)
      }

      // If there's career context, save it as a text artifact too
      if (careerContext.trim()) {
        const blob = new Blob([careerContext], { type: 'text/plain' })
        const contextFile = new File([blob], 'career-context.txt', { type: 'text/plain' })

        const formData = new FormData()
        formData.append('file', contextFile)

        const response = await fetch('/api/artifacts/upload', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          uploadedArtifactIds.push(data.artifactId)
        }
      }

      toast.success(`Uploaded ${uploadedArtifactIds.length} file(s)`)

      // Redirect to processing page with artifact IDs
      router.push(`/dashboard/story/processing?ids=${uploadedArtifactIds.join(',')}`)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload files')
      toast.error('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tell Your Story</h1>
        <p className="text-gray-600 mt-1">
          Upload your career documents and share context about your experience
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* CV Upload - Required */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Your CV
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Required</span>
          </CardTitle>
          <CardDescription>
            Upload your main CV or resume. We&apos;ll extract key achievements and experiences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleCvDrop}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-colors
              ${cvFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'}
            `}
          >
            {cvFile ? (
              <div className="flex items-center justify-center gap-3">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-left">
                  <p className="font-medium text-gray-900">{cvFile.name}</p>
                  <p className="text-sm text-gray-500">{(cvFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setCvFile(null)}>
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <svg className="w-10 h-10 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-600">
                  Drag and drop your CV here, or{' '}
                  <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                    browse
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleCvSelect} />
                  </label>
                </p>
                <p className="text-xs text-gray-500">PDF, DOC, DOCX, or TXT up to 10MB</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Supporting Documents - Optional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Supporting Documents
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Optional</span>
          </CardTitle>
          <CardDescription>
            Add PRDs, pitch decks, design docs, or anything that showcases your work
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleSupportingDrop}
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors"
          >
            <label className="cursor-pointer">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add more files</span>
              </div>
              <input type="file" className="hidden" multiple accept=".pdf,.doc,.docx,.txt" onChange={handleSupportingSelect} />
            </label>
          </div>

          {supportingFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {supportingFiles.map(({ file, id }) => (
                <div key={id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeSupportingFile(id)}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Career Deep Dive - Optional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Career Deep Dive
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Optional</span>
          </CardTitle>
          <CardDescription>
            Share anything that might not be in your documents - achievements, context, or career highlights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={careerContext}
            onChange={(e) => setCareerContext(e.target.value)}
            placeholder="What are you most proud of in your career? What impact have you made that numbers can't capture? Any context that would help us understand your story better..."
            className="w-full h-40 p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <p className="text-xs text-gray-500 mt-2">
            This helps us extract richer insights from your documents
          </p>
        </CardContent>
      </Card>

      {/* What Happens Next */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">What happens next?</p>
              <p className="text-sm text-gray-600 mt-1">
                We&apos;ll analyze your documents to extract key themes, strengths, and career highlights.
                This usually takes 1-2 minutes. You&apos;ll be able to review everything on your Career Insights page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => router.back()} disabled={isUploading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!cvFile || isUploading} className="flex-1">
          {isUploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </>
          ) : (
            'Process My Story'
          )}
        </Button>
      </div>
    </div>
  )
}
