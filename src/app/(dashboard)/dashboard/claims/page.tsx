import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/features/claims/status-badge'

type Claim = {
  id: string
  claim_type: string
  canonical_text: string
  truth_status: string
  evidence_strength: string
  confidence_score: number
  risk_flags: string[]
  created_at: string
}

const claimTypeColors: Record<string, string> = {
  achievement: 'bg-green-100 text-green-800',
  responsibility: 'bg-blue-100 text-blue-800',
  skill: 'bg-purple-100 text-purple-800',
  credential: 'bg-yellow-100 text-yellow-800',
  context: 'bg-gray-100 text-gray-800',
}

const strengthColors: Record<string, string> = {
  strong: 'text-green-600',
  medium: 'text-yellow-600',
  weak: 'text-red-600',
}

export default async function ClaimsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: claims, error } = await supabase
    .from('claims')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching claims:', error)
  }

  // Group claims by type
  const claimsByType = (claims || []).reduce((acc, claim) => {
    const type = claim.claim_type || 'other'
    if (!acc[type]) acc[type] = []
    acc[type].push(claim)
    return acc
  }, {} as Record<string, Claim[]>)

  const typeOrder = ['achievement', 'responsibility', 'skill', 'credential', 'context']

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">All Career Insights</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            {claims?.length || 0} insights extracted from your documents
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/insights">
            <Button variant="outline" className="w-full sm:w-auto">← Back to Highlights</Button>
          </Link>
          <Link href="/dashboard/story">
            <Button className="w-full sm:w-auto">Add Documents</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {typeOrder.map((type) => (
          <Card key={type}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{claimsByType[type]?.length || 0}</div>
              <div className="text-sm text-gray-500 capitalize">{type === 'responsibility' ? 'Responsibilities' : `${type}s`}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!claims || claims.length === 0) ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No claims yet</h3>
            <p className="text-gray-500 mb-6">
              Upload a document to automatically extract career claims
            </p>
            <Link href="/dashboard/artifacts/upload">
              <Button>Upload your first document</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {typeOrder.map((type) => {
            const typeClaims = claimsByType[type]
            if (!typeClaims || typeClaims.length === 0) return null

            return (
              <div key={type}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 capitalize flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${claimTypeColors[type]}`}>
                    {type}
                  </span>
                  <span className="text-gray-400 text-sm font-normal">
                    {typeClaims.length} claim{typeClaims.length !== 1 ? 's' : ''}
                  </span>
                </h2>
                <div className="space-y-3">
                  {typeClaims.map((claim: Claim) => (
                    <Link key={claim.id} href={`/dashboard/claims/${claim.id}`}>
                      <Card className="hover:border-gray-300 transition-colors cursor-pointer">
                        <CardContent className="py-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 text-sm sm:text-base">{claim.canonical_text}</p>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs sm:text-sm">
                                <span className={`${strengthColors[claim.evidence_strength]} font-medium`}>
                                  {claim.evidence_strength} evidence
                                </span>
                                <span className="text-gray-400">
                                  {Math.round(claim.confidence_score * 100)}% confidence
                                </span>
                                {claim.risk_flags && claim.risk_flags.length > 0 && (
                                  <span className="text-orange-600 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    {claim.risk_flags.length} flag{claim.risk_flags.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0 self-start">
                              <StatusBadge status={claim.truth_status as 'unverified' | 'verified' | 'disputed'} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
