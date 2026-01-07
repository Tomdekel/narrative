import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HowYouFit } from '@/components/features/roles/how-you-fit'

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

  // Get requirements and signals
  const mustHaves = (role.must_haves || []) as Requirement[]
  const implicitSignals = (role.implicit_signals || []) as ImplicitSignal[]

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
        <Link href={`/dashboard/roles/${id}/generate`}>
          <Button variant="outline">Generate Resume</Button>
        </Link>
      </div>

      {/* How You Fit - Semantic analysis */}
      <HowYouFit
        roleId={id}
        initialAnalysis={role.fit_analysis}
        userCorrections={role.user_corrections}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Key Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mustHaves.map((req, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-200">
                      <span className="text-xs font-medium text-gray-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{req.skill}</p>
                      {req.experience_level && (
                        <p className="text-sm text-gray-600">{req.experience_level}</p>
                      )}
                      {req.context && (
                        <p className="text-xs text-gray-500 mt-1">{req.context}</p>
                      )}
                    </div>
                  </div>
                ))}
                {mustHaves.length === 0 && (
                  <p className="text-gray-500">No key requirements identified</p>
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
