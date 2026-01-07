import { extractText } from 'unpdf'

export async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  try {
    const { text } = await extractText(buffer, { mergePages: true })
    return text
  } catch (error) {
    console.error('PDF extraction error:', error)
    throw new Error('Failed to extract text from PDF')
  }
}

export async function extractTextFromBuffer(
  buffer: ArrayBuffer,
  fileType: string
): Promise<string> {
  switch (fileType) {
    case 'pdf':
      return extractTextFromPDF(buffer)
    case 'txt':
      const decoder = new TextDecoder('utf-8')
      return decoder.decode(buffer)
    case 'docx':
      // For DOCX, we'd need a different library
      // For MVP, we'll handle this as a limitation
      throw new Error('DOCX parsing not yet implemented. Please upload a PDF.')
    default:
      throw new Error(`Unsupported file type: ${fileType}`)
  }
}
