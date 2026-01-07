import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Artifact = {
  id: string
  file_name: string
  file_type: string
  status: string
  created_at: string
  processed_at: string | null
}

function getStatusColor(status: string) {
  switch (status) {
    case 'ready':
      return 'bg-green-100 text-green-800'
    case 'processing':
      return 'bg-blue-100 text-blue-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getFileIcon(fileType: string) {
  if (fileType === 'pdf') {
    return (
      <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zm-3 9.5c0 .83-.67 1.5-1.5 1.5H7v2H5.5v-6H8.5c.83 0 1.5.67 1.5 1.5v1zm4.5 3.5h-2.5v-6h2.5c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2zm5-4.5v1h-2v1.5h-1.5v-6h4v1.5h-2.5v2h2.5z" />
      </svg>
    )
  }
  return (
    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

export default async function ArtifactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: artifacts, error } = await supabase
    .from('artifacts')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching artifacts:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Artifacts</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Upload and manage your career documents</p>
        </div>
        <Link href="/dashboard/artifacts/upload">
          <Button className="w-full sm:w-auto">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Document
          </Button>
        </Link>
      </div>

      {!artifacts || artifacts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No artifacts yet</h3>
            <p className="text-gray-500 text-center mb-4">
              Upload your CV, PRDs, or other career documents to extract claims
            </p>
            <Link href="/dashboard/artifacts/upload">
              <Button>Upload your first document</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {artifacts.map((artifact: Artifact) => (
            <Link key={artifact.id} href={`/dashboard/artifacts/${artifact.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center gap-3 sm:gap-4 py-3 sm:py-4">
                  <div className="flex-shrink-0 hidden sm:block">
                    {getFileIcon(artifact.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                      {artifact.file_name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Uploaded {new Date(artifact.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(artifact.status)} text-xs`}>
                    {artifact.status}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
