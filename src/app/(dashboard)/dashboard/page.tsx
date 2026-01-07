import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ProgressStepper } from '@/components/ui/progress-stepper'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  // Fetch counts for progress tracking
  const [artifactsResult, claimsResult, rolesResult, resumesResult] = await Promise.all([
    supabase.from('artifacts').select('id', { count: 'exact', head: true }),
    supabase.from('claims').select('id', { count: 'exact', head: true }),
    supabase.from('role_intents').select('id', { count: 'exact', head: true }),
    supabase.from('resume_drafts').select('id', { count: 'exact', head: true }),
  ])

  const artifactsCount = artifactsResult.count || 0
  const claimsCount = claimsResult.count || 0
  const rolesCount = rolesResult.count || 0
  const resumesCount = resumesResult.count || 0

  // Determine user progress
  const hasStory = artifactsCount > 0
  const hasInsights = claimsCount > 0
  const hasRole = rolesCount > 0
  const hasResume = resumesCount > 0

  const steps = [
    { id: 'story', label: 'Tell Story', href: '/dashboard/story', completed: hasStory, current: !hasStory },
    { id: 'insights', label: 'Insights', href: '/dashboard/insights', completed: hasInsights, current: hasStory && !hasInsights },
    { id: 'role', label: 'Target Role', href: '/dashboard/roles', completed: hasRole, current: hasInsights && !hasRole },
    { id: 'resume', label: 'Resume', href: '/dashboard/resumes', completed: hasResume, current: hasRole && !hasResume },
  ]

  // Determine next action
  let nextAction = {
    label: 'Tell Your Story',
    description: 'Upload your CV and career documents to get started',
    href: '/dashboard/story',
    buttonText: 'Get Started',
  }

  if (hasStory && !hasInsights) {
    nextAction = {
      label: 'Processing...',
      description: 'Your documents are being analyzed. Check back soon!',
      href: '/dashboard/insights',
      buttonText: 'View Progress',
    }
  } else if (hasInsights && !hasRole) {
    nextAction = {
      label: 'Target a Role',
      description: 'Add a job description to see how your experience matches',
      href: '/dashboard/roles/new',
      buttonText: 'Add Target Role',
    }
  } else if (hasRole && !hasResume) {
    nextAction = {
      label: 'Generate Resume',
      description: 'Create a tailored resume for your target role',
      href: '/dashboard/roles',
      buttonText: 'View Roles',
    }
  } else if (hasResume) {
    nextAction = {
      label: 'All Set!',
      description: 'Your tailored resume is ready. You can always add more roles or update your story.',
      href: '/dashboard/resumes',
      buttonText: 'View Resumes',
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Welcome */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {firstName}</h1>
        <p className="text-gray-600 mt-1">Your career narrative is taking shape</p>
      </div>

      {/* Progress Stepper */}
      <Card>
        <CardContent className="pt-6 pb-4">
          <ProgressStepper steps={steps} />
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="font-semibold text-gray-900">{artifactsCount}</span> document{artifactsCount !== 1 ? 's' : ''}
        </span>
        <span className="text-gray-300">|</span>
        <span className="flex items-center gap-1.5">
          <span className="font-semibold text-gray-900">{claimsCount}</span> insight{claimsCount !== 1 ? 's' : ''}
        </span>
        <span className="text-gray-300">|</span>
        <span className="flex items-center gap-1.5">
          <span className="font-semibold text-gray-900">{rolesCount}</span> target role{rolesCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Next Action CTA */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{nextAction.label}</h2>
              <p className="text-gray-600 mt-1">{nextAction.description}</p>
            </div>
            <Link href={nextAction.href}>
              <Button size="lg">
                {nextAction.buttonText}
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      {hasInsights && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/dashboard/story" className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Add More</p>
                <p className="text-xs text-gray-500">Upload documents</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/insights" className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Career Insights</p>
                <p className="text-xs text-gray-500">{claimsCount} insights</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/roles" className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Target Roles</p>
                <p className="text-xs text-gray-500">{rolesCount} role{rolesCount !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
