import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processArtifact } from '@/server/jobs/artifact-processor'
import { processClaimExtraction } from '@/server/jobs/claim-extractor'

export const maxDuration = 60 // Allow up to 60 seconds for processing

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const isCv = formData.get('is_cv') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('artifacts')
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Determine file type
    let fileType = 'unknown'
    if (file.type === 'application/pdf') fileType = 'pdf'
    else if (file.type === 'text/plain') fileType = 'txt'
    else if (file.type.includes('word')) fileType = 'docx'

    // If this is a CV upload, unmark any existing CVs for this user
    if (isCv) {
      await supabase
        .from('artifacts')
        .update({ is_cv: false })
        .eq('user_id', user.id)
        .eq('is_cv', true)
    }

    // Create artifact record
    const { data: artifact, error: dbError } = await supabase
      .from('artifacts')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_type: fileType,
        storage_path: fileName,
        status: 'processing',
        is_cv: isCv,
        metadata: {
          size: file.size,
          mime_type: file.type,
        },
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Failed to create artifact record' }, { status: 500 })
    }

    // Create processing job for tracking
    const { data: job, error: jobError } = await supabase
      .from('processing_jobs')
      .insert({
        user_id: user.id,
        job_type: 'extract_text',
        entity_type: 'artifact',
        entity_id: artifact.id,
        status: 'processing',
        payload: {
          artifact_id: artifact.id,
          storage_path: fileName,
          file_type: fileType,
        },
      })
      .select()
      .single()

    if (jobError) {
      console.error('Job creation error:', jobError)
    }

    // Process immediately (text extraction)
    try {
      if (job) {
        await processArtifact(job.id, {
          artifact_id: artifact.id,
          storage_path: fileName,
          file_type: fileType,
        })
      }
    } catch (processError) {
      console.error('Processing error:', processError)
      // Don't fail the upload, just mark job as failed
      if (job) {
        await supabase
          .from('processing_jobs')
          .update({
            status: 'failed',
            last_error: String(processError),
          })
          .eq('id', job.id)
      }
    }

    return NextResponse.json({
      success: true,
      artifactId: artifact.id,
      message: 'File uploaded and processing started'
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    )
  }
}
