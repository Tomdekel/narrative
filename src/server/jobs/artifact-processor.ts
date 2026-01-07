import { createClient } from '@supabase/supabase-js'
import { extractTextFromBuffer } from '@/lib/pdf/parser'
import { generateEmbedding } from '@/lib/openai/client'

// Create admin client for server-side operations
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export async function processArtifact(jobId: string, payload: {
  artifact_id: string
  storage_path: string
  file_type: string
}) {
  const supabase = createAdminClient()
  const { artifact_id, storage_path, file_type } = payload

  try {
    // Update job status to processing
    await supabase
      .from('processing_jobs')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', jobId)

    // Update artifact status
    await supabase
      .from('artifacts')
      .update({ status: 'processing' })
      .eq('id', artifact_id)

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('artifacts')
      .download(storage_path)

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    // Extract text
    const buffer = await fileData.arrayBuffer()
    const extractedText = await extractTextFromBuffer(buffer, file_type)

    // Get artifact user_id for creating snippets and queueing next job
    const { data: artifact } = await supabase
      .from('artifacts')
      .select('user_id')
      .eq('id', artifact_id)
      .single()

    // Update artifact with extracted text (status remains processing while claims are extracted)
    await supabase
      .from('artifacts')
      .update({
        extracted_text: extractedText,
        status: 'extract_claims', // Next stage
      })
      .eq('id', artifact_id)

    if (artifact) {
      // Create evidence snippets (chunk the text)
      const chunks = chunkText(extractedText, 500)

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]

        // Generate embedding for the chunk
        let embedding = null
        if (process.env.OPENAI_API_KEY) {
          try {
            embedding = await generateEmbedding(chunk)
          } catch (e) {
            console.warn('Failed to generate embedding:', e)
          }
        }

        await supabase.from('evidence_snippets').insert({
          artifact_id,
          user_id: artifact.user_id,
          content: chunk,
          position_in_doc: i,
          embedding,
        })
      }

      // Queue claim extraction job
      await supabase.from('processing_jobs').insert({
        user_id: artifact.user_id,
        job_type: 'extract_claims',
        entity_type: 'artifact',
        entity_id: artifact_id,
        payload: {
          artifact_id,
          user_id: artifact.user_id,
        },
        status: 'pending',
        scheduled_for: new Date().toISOString(),
      })
    }

    // Mark text extraction job as completed
    await supabase
      .from('processing_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    return { success: true }
  } catch (error) {
    console.error('Artifact processing error:', error)

    // Mark job as failed
    await supabase
      .from('processing_jobs')
      .update({
        status: 'failed',
        last_error: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    // Mark artifact as failed
    await supabase
      .from('artifacts')
      .update({ status: 'failed' })
      .eq('id', artifact_id)

    return { success: false, error }
  }
}

// Helper function to chunk text
function chunkText(text: string, maxChunkSize: number): string[] {
  const chunks: string[] = []
  const sentences = text.split(/(?<=[.!?])\s+/)
  let currentChunk = ''

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = ''
    }
    currentChunk += sentence + ' '
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}
