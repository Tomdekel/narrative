import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ThemesGrid } from '@/components/features/insights/themes-grid'
import { StrengthsList } from '@/components/features/insights/strengths-list'
import { ExperienceCard } from '@/components/features/insights/experience-card'
import { AddInsight } from '@/components/features/insights/add-insight'

type Claim = {
  id: string
  canonical_text: string
  claim_type: string
  evidence_strength: string
  confidence_score: number
  source_artifact_id: string | null
  created_at: string
}

type Artifact = {
  id: string
  file_name: string
}

export default async function InsightsPage() {
  const supabase = await createClient()

  // Fetch all claims
  const { data: claims, error } = await supabase
    .from('claims')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch artifacts for grouping
  const { data: artifacts } = await supabase
    .from('artifacts')
    .select('id, file_name')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching claims:', error)
  }

  const claimsList: Claim[] = claims || []
  const artifactsList: Artifact[] = artifacts || []

  // Extract themes from claim types and content
  const themes = extractThemes(claimsList)

  // Extract top strengths (achievements with high confidence)
  const strengths = extractStrengths(claimsList)

  // Group claims by source artifact
  const claimsByArtifact = groupClaimsByArtifact(claimsList, artifactsList)

  if (claimsList.length === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Career Insights</h1>
          <p className="text-gray-600 mt-1">
            Your career themes, strengths, and key experiences
          </p>
        </div>

        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No insights yet</h3>
            <p className="text-gray-600 mb-6">
              Upload your career documents to discover your key themes and strengths
            </p>
            <Link href="/dashboard/story">
              <Button>Tell Your Story</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Career Insights</h1>
          <p className="text-gray-600 mt-1">
            Based on {claimsList.length} insights from {artifactsList.length} document{artifactsList.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/dashboard/story">
          <Button variant="outline" size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add More
          </Button>
        </Link>
      </div>

      {/* Key Themes */}
      {themes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Themes</CardTitle>
          </CardHeader>
          <CardContent>
            <ThemesGrid themes={themes} />
          </CardContent>
        </Card>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <StrengthsList strengths={strengths} />
          </CardContent>
        </Card>
      )}

      {/* Experience Highlights by Document */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Experience Highlights</h2>
        {claimsByArtifact.map(({ artifact, claims }) => (
          <ExperienceCard
            key={artifact?.id || 'unknown'}
            title={artifact?.file_name || 'Career Context'}
            claims={claims}
          />
        ))}

        {/* Add Insight */}
        <AddInsight />
      </div>

      {/* View All Link */}
      <div className="text-center pt-4">
        <Link href="/dashboard/insights" className="text-sm text-blue-600 hover:text-blue-700">
          View all {claimsList.length} insights
        </Link>
      </div>
    </div>
  )
}

// Helper functions

function extractThemes(claims: Claim[]): string[] {
  const themeKeywords: Record<string, string[]> = {
    'Product Strategy': ['product', 'strategy', 'roadmap', 'vision', 'planning'],
    'Leadership': ['led', 'managed', 'team', 'leadership', 'cross-functional'],
    'AI & Machine Learning': ['ai', 'ml', 'machine learning', 'artificial intelligence', 'data science'],
    'Growth & Metrics': ['growth', 'metrics', 'kpi', 'revenue', 'conversion', 'analytics'],
    'User Experience': ['ux', 'user experience', 'design', 'usability', 'customer'],
    'Technical': ['engineering', 'architecture', 'technical', 'development', 'system'],
    'Innovation': ['innovation', 'innovative', 'new', 'launch', '0-to-1', 'zero to one'],
    'Communication': ['stakeholder', 'presentation', 'communication', 'executive'],
  }

  const themeCounts: Record<string, number> = {}
  const claimTexts = claims.map(c => c.canonical_text.toLowerCase())

  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    let count = 0
    for (const text of claimTexts) {
      if (keywords.some(kw => text.includes(kw))) {
        count++
      }
    }
    if (count > 0) {
      themeCounts[theme] = count
    }
  }

  // Return top 5 themes sorted by count
  return Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme]) => theme)
}

function extractStrengths(claims: Claim[]): string[] {
  // Get high-confidence achievements
  const achievements = claims
    .filter(c => c.claim_type === 'achievement' && c.confidence_score >= 0.7)
    .sort((a, b) => b.confidence_score - a.confidence_score)
    .slice(0, 5)
    .map(c => c.canonical_text)

  // If not enough achievements, add responsibilities
  if (achievements.length < 3) {
    const responsibilities = claims
      .filter(c => c.claim_type === 'responsibility' && c.confidence_score >= 0.6)
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, 5 - achievements.length)
      .map(c => c.canonical_text)

    return [...achievements, ...responsibilities]
  }

  return achievements
}

function groupClaimsByArtifact(claims: Claim[], artifacts: Artifact[]) {
  const groups: { artifact: Artifact | null; claims: Claim[] }[] = []
  const artifactMap = new Map(artifacts.map(a => [a.id, a]))

  // Group by artifact
  const claimsByArtifactId = new Map<string | null, Claim[]>()
  for (const claim of claims) {
    const key = claim.source_artifact_id
    if (!claimsByArtifactId.has(key)) {
      claimsByArtifactId.set(key, [])
    }
    claimsByArtifactId.get(key)!.push(claim)
  }

  // Convert to array
  for (const [artifactId, claimGroup] of claimsByArtifactId) {
    groups.push({
      artifact: artifactId ? artifactMap.get(artifactId) || null : null,
      claims: claimGroup.slice(0, 5), // Limit to 5 per artifact
    })
  }

  return groups
}
