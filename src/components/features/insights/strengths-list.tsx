'use client'

interface StrengthsListProps {
  strengths: string[]
}

export function StrengthsList({ strengths }: StrengthsListProps) {
  return (
    <ul className="space-y-3">
      {strengths.map((strength, index) => (
        <li key={index} className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-700">{strength}</p>
        </li>
      ))}
    </ul>
  )
}
