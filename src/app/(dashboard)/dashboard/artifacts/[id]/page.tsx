import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProcessingStatus } from '@/components/features/artifacts/processing-status'

type Props = {
  params: Promise<{ id: string }>
}

function getStatusInfo(status: string) {
  switch (status) {
    case 'ready':
      return { color: 'bg-green-100 text-green-800', label: 'Ready', icon: '✓' }
    case 'processing':
      return { color: 'bg-blue-100 text-blue-800', label: 'Processing', icon: '⟳' }
    case 'pending':
      return { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: '○' }
    case 'failed':
      return { color: 'bg-red-100 text-red-800', label: 'Failed', icon: '✗' }
    default:
      return { color: 'bg-gray-100 text-gray-800', label: status, icon: '?' }
  }
}

export default async function ArtifactDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: artifact, error } = await supabase
    .from('artifacts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user?.id)
    .single()

  if (error || !artifact) {
    notFound()
  }

  // Get related processing jobs
  const { data: jobs } = await supabase
    .from('processing_jobs')
    .select('*')
    .eq('entity_id', id)
    .order('created_at', { ascending: false })

  // Get extracted claims count
  const { count: claimsCount } = await supabase
    .from('claims')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)
  // Note: In a real implementation, we'd filter by claims linked to this artifact's snippets

  const statusInfo = getStatusInfo(artifact.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/artifacts"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Artifacts
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{artifact.file_name}</h1>
          <p className="text-gray-500 mt-1">
            Uploaded {new Date(artifact.created_at).toLocaleDateString()} at{' '}
            {new Date(artifact.created_at).toLocaleTimeString()}
          </p>
        </div>
        <Badge className={statusInfo.color}>
          {statusInfo.icon} {statusInfo.label}
        </Badge>
      </div>

      {/* Processing Status (Client Component for real-time updates) */}
      {artifact.status !== 'ready' && (
        <ProcessingStatus artifactId={artifact.id} initialStatus={artifact.status} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{artifact.file_type.toUpperCase()}</div>
            <p className="text-sm text-gray-500">File Type</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {artifact.metadata?.size
                ? `${(artifact.metadata.size / 1024).toFixed(1)} KB`
                : 'Unknown'}
            </div>
            <p className="text-sm text-gray-500">File Size</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{claimsCount || 0}</div>
            <p className="text-sm text-gray-500">Claims Extracted</p>
          </CardContent>
        </Card>
      </div>

      {/* Extracted Text */}
      {artifact.extracted_text && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Text</CardTitle>
            <CardDescription>
              Raw text extracted from your document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg max-h-96 overflow-auto font-mono">
              {artifact.extracted_text}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Processing Jobs */}
      {jobs && jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {jobs.map((job: any) => (
                <div key={job.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{job.job_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(job.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge className={getStatusInfo(job.status).color}>
                    {job.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {artifact.status === 'ready' && (
          <Link href="/dashboard/claims">
            <Button>View Extracted Claims</Button>
          </Link>
        )}
        {artifact.status === 'failed' && (
          <Button variant="outline">Retry Processing</Button>
        )}
      </div>
    </div>
  )
}
