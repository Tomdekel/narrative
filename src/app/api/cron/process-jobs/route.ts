import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processArtifact } from '@/server/jobs/artifact-processor'
import { processClaimExtraction } from '@/server/jobs/claim-extractor'

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: Request) {
  // Verify authorization
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  try {
    // Get pending jobs
    const { data: jobs, error } = await supabase
      .from('processing_jobs')
      .select('*')
      .in('status', ['pending', 'retry'])
      .lte('scheduled_for', new Date().toISOString())
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(5) // Process up to 5 jobs per invocation

    if (error) {
      console.error('Error fetching jobs:', error)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ message: 'No jobs to process', processed: 0 })
    }

    const results = []

    for (const job of jobs) {
      // Increment attempts
      await supabase
        .from('processing_jobs')
        .update({ attempts: job.attempts + 1 })
        .eq('id', job.id)

      try {
        switch (job.job_type) {
          case 'extract_text':
            await processArtifact(job.id, job.payload)
            break
          case 'extract_claims':
            await processClaimExtraction(job.id, job.payload)
            break
          default:
            console.warn(`Unknown job type: ${job.job_type}`)
        }

        results.push({ job_id: job.id, status: 'processed' })
      } catch (jobError) {
        console.error(`Error processing job ${job.id}:`, jobError)
        results.push({ job_id: job.id, status: 'failed', error: String(jobError) })
      }
    }

    return NextResponse.json({
      message: `Processed ${results.length} jobs`,
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggers
export async function POST(request: Request) {
  return GET(request)
}
