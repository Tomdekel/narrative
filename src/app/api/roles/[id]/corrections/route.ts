import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { corrections } = await request.json()

    // Update role intent with corrections and clear cached fit analysis
    const { error } = await supabase
      .from('role_intents')
      .update({
        user_corrections: corrections,
        fit_analysis: null, // Clear cache to force re-analysis
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error saving corrections:', error)
      return NextResponse.json({ error: 'Failed to save corrections' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Corrections error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
