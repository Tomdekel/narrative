import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClaimEditor } from '@/components/features/claims/claim-editor'
import { StatusSelector } from '@/components/features/claims/status-selector'
import { VariantsManager } from '@/components/features/claims/variants-manager'
import { SkillTagger } from '@/components/features/claims/skill-tagger'

type PageProps = {
  params: Promise<{ id: string }>
}

const claimTypeColors: Record<string, string> = {
  achievement: 'bg-green-100 text-green-800',
  responsibility: 'bg-blue-100 text-blue-800',
  skill: 'bg-purple-100 text-purple-800',
  credential: 'bg-yellow-100 text-yellow-800',
  context: 'bg-gray-100 text-gray-800',
}

const strengthColors: Record<string, string> = {
  strong: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  weak: 'bg-red-100 text-red-800',
}

export default async function ClaimDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch claim with related data
  const { data: claim, error } = await supabase
    .from('claims')
    .select(`
      *,
      claim_support (
        id,
        evidence_type,
        source_text,
        artifact_id,
        artifacts (
          id,
          file_name
        )
      ),
      claim_skill (
        id,
        proficiency_demonstrated,
        skills (
          id,
          name,
          category
        )
      ),
      metrics (
        id,
        metric_type,
        value_numeric,
        unit,
        context
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !claim) {
    notFound()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/claims" className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className={`px-2 py-1 rounded text-xs font-medium ${claimTypeColors[claim.claim_type]}`}>
            {claim.claim_type}
          </span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${strengthColors[claim.evidence_strength]}`}>
            {claim.evidence_strength} evidence
          </span>
        </div>
        <ClaimEditor claimId={claim.id} initialText={claim.canonical_text} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Evidence */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Supporting Evidence</CardTitle>
            </CardHeader>
            <CardContent>
              {claim.claim_support && claim.claim_support.length > 0 ? (
                <div className="space-y-4">
                  {claim.claim_support.map((support: {
                    id: string
                    evidence_type: string
                    source_text: string
                    artifact_id: string
                    artifacts: { id: string; file_name: string } | null
                  }) => (
                    <div key={support.id} className="border-l-2 border-blue-200 pl-4 py-2">
                      <p className="text-gray-700 italic">&ldquo;{support.source_text}&rdquo;</p>
                      {support.artifacts && (
                        <Link
                          href={`/dashboard/artifacts/${support.artifact_id}`}
                          className="text-sm text-blue-600 hover:underline mt-2 inline-flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {support.artifacts.file_name}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No evidence linked yet</p>
              )}
            </CardContent>
          </Card>

          {/* Metrics */}
          {claim.metrics && claim.metrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {claim.metrics.map((metric: {
                    id: string
                    metric_type: string
                    value_numeric: number | null
                    unit: string
                    context: string
                  }) => (
                    <div key={metric.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {metric.value_numeric}{metric.unit}
                      </div>
                      <div className="text-sm text-gray-500">{metric.context}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Variants */}
          <VariantsManager
            claimId={claim.id}
            canonicalText={claim.canonical_text}
            initialVariants={claim.variants || []}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusSelector
                claimId={claim.id}
                initialStatus={claim.truth_status}
              />
              <div>
                <label className="text-sm text-gray-500">Confidence Score</label>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${claim.confidence_score * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {Math.round(claim.confidence_score * 100)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <SkillTagger
            claimId={claim.id}
            initialSkills={claim.claim_skill || []}
          />

          {/* Risk Flags */}
          {claim.risk_flags && claim.risk_flags.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Risk Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {claim.risk_flags.map((flag: string, index: number) => (
                    <li key={index} className="text-orange-800 text-sm">
                      {flag}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
