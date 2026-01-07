import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Try platform-specific extraction first
    const platformText = await tryPlatformSpecificExtraction(parsedUrl)
    if (platformText) {
      return NextResponse.json({
        success: true,
        jobDescription: platformText,
      })
    }

    // Fall back to generic HTML extraction
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status}` },
        { status: 400 }
      )
    }

    const html = await response.text()

    // Try JSON-LD extraction first (many job sites use this)
    const jsonLdText = extractFromJsonLd(html)
    if (jsonLdText && jsonLdText.length > 100) {
      return NextResponse.json({
        success: true,
        jobDescription: jsonLdText,
      })
    }

    // Try extracting from initial state (SPAs often embed data)
    const initialStateText = extractFromInitialState(html)
    if (initialStateText && initialStateText.length > 100) {
      return NextResponse.json({
        success: true,
        jobDescription: initialStateText,
      })
    }

    // Fall back to generic HTML extraction
    const text = extractJobDescription(html)

    if (!text || text.length < 100) {
      return NextResponse.json(
        { error: 'Could not extract job description. This site may require JavaScript. Try copying and pasting the job description directly.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      jobDescription: text,
    })
  } catch (error) {
    console.error('JD fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job description' },
      { status: 500 }
    )
  }
}

// Platform-specific extraction for known job boards
async function tryPlatformSpecificExtraction(url: URL): Promise<string | null> {
  const hostname = url.hostname.toLowerCase()

  // Ashby
  if (hostname.includes('ashbyhq.com')) {
    return await extractFromAshby(url)
  }

  // Greenhouse
  if (hostname.includes('greenhouse.io') || hostname.includes('boards.greenhouse.io')) {
    return await extractFromGreenhouse(url)
  }

  // Lever
  if (hostname.includes('lever.co') || hostname.includes('jobs.lever.co')) {
    return await extractFromLever(url)
  }

  return null
}

async function extractFromAshby(url: URL): Promise<string | null> {
  try {
    // Ashby has an API endpoint for job postings
    // URL format: jobs.ashbyhq.com/{company}/{job-id}
    const pathParts = url.pathname.split('/').filter(Boolean)
    if (pathParts.length < 2) return null

    const company = pathParts[0]
    const jobId = pathParts[1]

    // Try the Ashby API
    const apiUrl = `https://api.ashbyhq.com/posting-api/job-board/${company}/posting/${jobId}`
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) return null

    const data = await response.json()
    if (!data) return null

    // Build the job description from API response
    const parts: string[] = []

    if (data.title) parts.push(`# ${data.title}`)
    if (data.locationName) parts.push(`Location: ${data.locationName}`)
    if (data.employmentType) parts.push(`Employment Type: ${data.employmentType}`)
    if (data.compensationTierSummary) parts.push(`Compensation: ${data.compensationTierSummary}`)

    parts.push('')

    if (data.descriptionHtml) {
      parts.push(stripHtml(data.descriptionHtml))
    } else if (data.descriptionPlain) {
      parts.push(data.descriptionPlain)
    }

    return parts.join('\n').trim()
  } catch (e) {
    console.error('Ashby extraction failed:', e)
    return null
  }
}

async function extractFromGreenhouse(url: URL): Promise<string | null> {
  try {
    // Greenhouse embeds job data in the page
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    })

    if (!response.ok) return null

    const html = await response.text()

    // Greenhouse uses specific class names
    const contentMatch = html.match(/<div[^>]*id="content"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*id="footer"/i)
    if (contentMatch) {
      return stripHtml(contentMatch[1])
    }

    return null
  } catch {
    return null
  }
}

async function extractFromLever(url: URL): Promise<string | null> {
  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    })

    if (!response.ok) return null

    const html = await response.text()

    // Lever uses specific class structure
    const contentMatch = html.match(/<div[^>]*class="[^"]*posting-[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*class="[^"]*posting-apply/i)
    if (contentMatch) {
      return stripHtml(contentMatch[1])
    }

    return extractJobDescription(html)
  } catch {
    return null
  }
}

function extractFromJsonLd(html: string): string | null {
  try {
    // Find JSON-LD script tags
    const jsonLdMatches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)

    for (const match of jsonLdMatches) {
      try {
        const data = JSON.parse(match[1])
        const jobData = Array.isArray(data) ? data.find(d => d['@type'] === 'JobPosting') : (data['@type'] === 'JobPosting' ? data : null)

        if (jobData) {
          const parts: string[] = []

          if (jobData.title) parts.push(`# ${jobData.title}`)
          if (jobData.hiringOrganization?.name) parts.push(`Company: ${jobData.hiringOrganization.name}`)
          if (jobData.jobLocation?.address?.addressLocality) {
            parts.push(`Location: ${jobData.jobLocation.address.addressLocality}`)
          }

          parts.push('')

          if (jobData.description) {
            parts.push(stripHtml(jobData.description))
          }

          if (jobData.responsibilities) {
            parts.push('\n## Responsibilities')
            parts.push(stripHtml(jobData.responsibilities))
          }

          if (jobData.qualifications) {
            parts.push('\n## Qualifications')
            parts.push(stripHtml(jobData.qualifications))
          }

          return parts.join('\n').trim()
        }
      } catch {
        continue
      }
    }
    return null
  } catch {
    return null
  }
}

function extractFromInitialState(html: string): string | null {
  try {
    // Look for common patterns of embedded JSON data
    const patterns = [
      /__INITIAL_STATE__\s*=\s*({[\s\S]*?});?\s*<\/script>/,
      /__NEXT_DATA__[^>]*>([\s\S]*?)<\/script>/,
      /window\.__data\s*=\s*({[\s\S]*?});?\s*<\/script>/,
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match) {
        try {
          const data = JSON.parse(match[1])
          // Look for job-related fields
          const jobDesc = findJobDescriptionInObject(data)
          if (jobDesc && jobDesc.length > 100) {
            return stripHtml(jobDesc)
          }
        } catch {
          continue
        }
      }
    }
    return null
  } catch {
    return null
  }
}

function findJobDescriptionInObject(obj: unknown, depth = 0): string | null {
  if (depth > 5 || !obj) return null

  if (typeof obj === 'object' && obj !== null) {
    const o = obj as Record<string, unknown>

    // Look for common job description field names
    const descriptionFields = ['description', 'descriptionHtml', 'jobDescription', 'content', 'body']
    for (const field of descriptionFields) {
      if (o[field] && typeof o[field] === 'string' && (o[field] as string).length > 100) {
        return o[field] as string
      }
    }

    // Recurse into nested objects
    for (const value of Object.values(o)) {
      const result = findJobDescriptionInObject(value, depth + 1)
      if (result) return result
    }
  }

  return null
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/\n +/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractJobDescription(html: string): string {
  // Remove script and style tags
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')

  // Try to find common job description containers
  const jobContainerPatterns = [
    /<article[^>]*class="[^"]*job[^"]*"[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class="[^"]*job-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*job_description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*posting[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*class="[^"]*job[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
  ]

  for (const pattern of jobContainerPatterns) {
    const match = text.match(pattern)
    if (match && match[1] && match[1].length > 200) {
      text = match[1]
      break
    }
  }

  // Replace HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&bull;/g, '•')

  // Convert HTML to text while preserving structure
  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '') // Remove all remaining HTML tags

  // Clean up whitespace
  text = text
    .replace(/\t/g, ' ')
    .replace(/ +/g, ' ')
    .replace(/\n +/g, '\n')
    .replace(/ +\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // Limit length
  if (text.length > 15000) {
    text = text.substring(0, 15000) + '...'
  }

  return text
}
