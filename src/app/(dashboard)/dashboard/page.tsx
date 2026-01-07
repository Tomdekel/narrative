import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {firstName}</h1>
        <p className="text-gray-600 mt-1">Build the right story for the right role.</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Artifact</CardTitle>
            <CardDescription>
              Add your CV, PRDs, or other career documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/artifacts/upload">
              <Button className="w-full">Upload Document</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">View Claims</CardTitle>
            <CardDescription>
              Review and edit your extracted career claims
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/claims">
              <Button variant="outline" className="w-full">View Claims</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Target a Role</CardTitle>
            <CardDescription>
              Add a job description to generate a tailored resume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/roles/new">
              <Button variant="outline" className="w-full">Add Target Role</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Stats placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">0</div>
            <p className="text-sm text-gray-500">Artifacts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">0</div>
            <p className="text-sm text-gray-500">Claims</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">0</div>
            <p className="text-sm text-gray-500">Target Roles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">0</div>
            <p className="text-sm text-gray-500">Resumes</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
