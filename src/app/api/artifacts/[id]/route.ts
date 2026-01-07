import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch the artifact to get storage path and verify ownership
    const { data: artifact, error: fetchError } = await supabase
      .from('artifacts')
      .select('storage_path')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !artifact) {
      return NextResponse.json({ error: 'Artifact not found' }, { status: 404 })
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('artifacts')
      .remove([artifact.storage_path])

    if (storageError) {
      console.error('Storage delete error:', storageError)
    }

    // Delete related claims
    await supabase
      .from('claims')
      .delete()
      .eq('artifact_id', id)

    // Delete artifact record
    const { error: deleteError } = await supabase
      .from('artifacts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Database delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete artifact' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete artifact' }, { status: 500 })
  }
}
