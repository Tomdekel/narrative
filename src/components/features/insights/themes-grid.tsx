'use client'

interface ThemesGridProps {
  themes: string[]
}

const themeColors: Record<string, string> = {
  'Product Strategy': 'bg-blue-100 text-blue-800',
  'Leadership': 'bg-purple-100 text-purple-800',
  'AI & Machine Learning': 'bg-green-100 text-green-800',
  'Growth & Metrics': 'bg-yellow-100 text-yellow-800',
  'User Experience': 'bg-pink-100 text-pink-800',
  'Technical': 'bg-indigo-100 text-indigo-800',
  'Innovation': 'bg-orange-100 text-orange-800',
  'Communication': 'bg-teal-100 text-teal-800',
}

export function ThemesGrid({ themes }: ThemesGridProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {themes.map((theme) => (
        <span
          key={theme}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            themeColors[theme] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {theme}
        </span>
      ))}
    </div>
  )
}
