import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getRecommendedClaims } from '@/lib/utils/matching'
import { ClaimRecommendations } from '@/components/features/roles/claim-recommendations'

type PageProps = {
  params: Promise<{ id: string }>
}

type Requirement = {
  skill: string
  experience_level?: string
  context?: string
}

type ImplicitSignal = {
  signal: string
  source_text: string
  confidence: number
}

const seniorityColors: Record<string, string> = {
  intern: 'bg-gray-100 text-gray-700',
  junior: 'bg-green-100 text-green-700',
  mid: 'bg-blue-100 text-blue-700',
  senior: 'bg-purple-100 text-purple-700',
  staff: 'bg-indigo-100 text-indigo-700',
  principal: 'bg-pink-100 text-pink-700',
  director: 'bg-orange-100 text-orange-700',
  vp: 'bg-red-100 text-red-700',
  'c-level': 'bg-yellow-100 text-yellow-700',
}

export default async function RoleDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch role intent
  const { data: role, error } = await supabase
    .from('role_intents')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !role) {
    notFound()
  }

  // Fetch user's claims with skills
  const { data: claims } = await supabase
    .from('claims')
    .select(`
      id,
      canonical_text,
      claim_type,
      confidence_score,
      evidence_strength,
      created_at,
      claim_skill (
        skills (
          name
        )
      )
    `)
    .eq('user_id', user.id)

  // Extract all skills from claims and prepare for matching
  const userSkills = new Set<string>()
  const claimsForMatching: {
    id: string
    canonical_text: string
    claim_type: string
    evidence_strength: string
    confidence_score: number
    skills: string[]
    created_at: string
  }[] = []

  const claimsById: Record<string, { id: string; canonical_text: string; claim_type: string; evidence_strength: string }> = {}

  claims?.forEach((claim) => {
    const skills: string[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    claim.claim_skill?.forEach((cs: any) => {
      if (cs.skills?.name) {
        userSkills.add(cs.skills.name.toLowerCase())
        skills.push(cs.skills.name)
      }
    })

    claimsForMatching.push({
      id: claim.id,
      canonical_text: claim.canonical_text,
      claim_type: claim.claim_type,
      evidence_strength: claim.evidence_strength,
      confidence_score: claim.confidence_score,
      skills,
      created_at: claim.created_at,
    })

    claimsById[claim.id] = {
      id: claim.id,
      canonical_text: claim.canonical_text,
      claim_type: claim.claim_type,
      evidence_strength: claim.evidence_strength,
    }
  })

  // Calculate skill coverage
  const mustHaves = (role.must_haves || []) as Requirement[]
  const niceToHaves = (role.nice_to_haves || []) as Requirement[]

  // Calculate claim recommendations
  const recommendedMatches = getRecommendedClaims(
    claimsForMatching,
    { must_haves: mustHaves, nice_to_haves: niceToHaves, seniority_level: role.level_inferred, domain: role.domain },
    role.function_inferred,
    { maxClaims: 15, minScore: 0.2 }
  )
  const implicitSignals = (role.implicit_signals || []) as ImplicitSignal[]

  const coveredMustHaves = mustHaves.filter((r) =>
    userSkills.has(r.skill.toLowerCase())
  )
  const missingMustHaves = mustHaves.filter(
    (r) => !userSkills.has(r.skill.toLowerCase())
  )
  const coveredNiceToHaves = niceToHaves.filter((r) =>
    userSkills.has(r.skill.toLowerCase())
  )

  const coveragePercent = mustHaves.length > 0
    ? Math.round((coveredMustHaves.length / mustHaves.length) * 100)
    : 100

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard/roles" className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <span className={`px-2 py-1 rounded text-xs font-medium ${seniorityColors[role.level_inferred] || 'bg-gray-100 text-gray-700'}`}>
              {role.level_inferred}
            </span>
            <span className="text-xs text-gray-500">{role.domain}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{role.title_raw}</h1>
          {role.company_raw && (
            <p className="text-gray-500">at {role.company_raw}</p>
          )}
        </div>
        <Button variant="outline">Generate Resume</Button>
      </div>

      {/* Coverage Overview */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Requirements Coverage</h3>
            <span className={`text-2xl font-bold ${
              coveragePercent >= 70 ? 'text-green-600' :
              coveragePercent >= 40 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {coveragePercent}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full ${
                coveragePercent >= 70 ? 'bg-green-500' :
                coveragePercent >= 40 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${coveragePercent}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-2xl font-bold text-green-600">{coveredMustHaves.length}</div>
              <div className="text-gray-500">Must-haves covered</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{missingMustHaves.length}</div>
              <div className="text-gray-500">Must-haves missing</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{coveredNiceToHaves.length}</div>
              <div className="text-gray-500">Nice-to-haves covered</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claim Recommendations */}
      <ClaimRecommendations
        matches={recommendedMatches}
        claims={claimsById}
        roleId={id}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Must-Haves */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Must-Have Requirements
                <span className="text-sm font-normal text-gray-500">
                  ({coveredMustHaves.length}/{mustHaves.length} covered)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mustHaves.map((req, index) => {
                  const isCovered = userSkills.has(req.skill.toLowerCase())
                  return (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        isCovered ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCovered ? 'bg-green-200' : 'bg-red-200'
                      }`}>
                        {isCovered ? (
                          <svg className="w-3 h-3 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className={`font-medium ${isCovered ? 'text-green-900' : 'text-red-900'}`}>
                          {req.skill}
                        </p>
                        {req.experience_level && (
                          <p className={`text-sm ${isCovered ? 'text-green-700' : 'text-red-700'}`}>
                            {req.experience_level}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
                {mustHaves.length === 0 && (
                  <p className="text-gray-500">No must-have requirements identified</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Nice-to-Haves */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Nice-to-Have Requirements
                <span className="text-sm font-normal text-gray-500">
                  ({coveredNiceToHaves.length}/{niceToHaves.length} covered)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {niceToHaves.map((req, index) => {
                  const isCovered = userSkills.has(req.skill.toLowerCase())
                  return (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        isCovered ? 'bg-blue-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCovered ? 'bg-blue-200' : 'bg-gray-200'
                      }`}>
                        {isCovered ? (
                          <svg className="w-3 h-3 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className={`font-medium ${isCovered ? 'text-blue-900' : 'text-gray-700'}`}>
                          {req.skill}
                        </p>
                        {req.experience_level && (
                          <p className={`text-sm ${isCovered ? 'text-blue-700' : 'text-gray-500'}`}>
                            {req.experience_level}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
                {niceToHaves.length === 0 && (
                  <p className="text-gray-500">No nice-to-have requirements identified</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Implicit Signals */}
          {implicitSignals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Implicit Signals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {implicitSignals.map((signal, index) => (
                    <div key={index} className="text-sm">
                      <p className="font-medium text-gray-900">{signal.signal}</p>
                      <p className="text-gray-500 text-xs mt-1 italic">
                        &ldquo;{signal.source_text}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
