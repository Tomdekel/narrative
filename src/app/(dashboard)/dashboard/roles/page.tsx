import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type RoleIntent = {
  id: string
  title_raw: string
  company_raw: string | null
  level_inferred: string
  domain: string
  must_haves: { skill: string }[]
  nice_to_haves: { skill: string }[]
  created_at: string
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

export default async function RolesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: roles, error } = await supabase
    .from('role_intents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching roles:', error)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Target Roles</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Paste job descriptions to match your claims against requirements
          </p>
        </div>
        <Link href="/dashboard/roles/new">
          <Button className="w-full sm:w-auto">Add Target Role</Button>
        </Link>
      </div>

      {(!roles || roles.length === 0) ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No target roles yet</h3>
            <p className="text-gray-500 mb-6">
              Add a job description to see how your claims match up
            </p>
            <Link href="/dashboard/roles/new">
              <Button>Add your first target role</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {roles.map((role: RoleIntent) => (
            <Link key={role.id} href={`/dashboard/roles/${role.id}`}>
              <Card className="hover:border-gray-300 transition-colors cursor-pointer">
                <CardContent className="py-4 sm:py-5">
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{role.title_raw}</h3>
                        {role.company_raw && (
                          <span className="text-gray-500 text-xs sm:text-sm">at {role.company_raw}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${seniorityColors[role.level_inferred] || 'bg-gray-100 text-gray-700'}`}>
                          {role.level_inferred}
                        </span>
                        <span className="text-xs text-gray-500">{role.domain}</span>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 mt-3 text-xs text-gray-500">
                        <span>{role.must_haves?.length || 0} must-haves</span>
                        <span>{role.nice_to_haves?.length || 0} nice-to-haves</span>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
