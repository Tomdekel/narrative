import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StoryForm } from '@/components/features/story/story-form'

export default async function StoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch existing artifacts
  const { data: artifacts } = await supabase
    .from('artifacts')
    .select('id, file_name, file_type, is_cv, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch career context
  const { data: careerContext } = await supabase
    .from('user_career_context')
    .select('career_deep_dive, guidelines_tips')
    .eq('user_id', user.id)
    .single()

  return (
    <StoryForm
      existingArtifacts={artifacts || []}
      existingContext={careerContext}
    />
  )
}
