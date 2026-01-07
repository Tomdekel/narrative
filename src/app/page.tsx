import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold">Narrative</div>
        <div className="space-x-4">
          <Link href="/login">
            <Button variant="ghost" className="text-white hover:text-gray-300">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Build the right story<br />
            <span className="text-blue-400">for the right role</span>
          </h1>
          <p className="mt-6 text-xl text-gray-300 max-w-2xl mx-auto">
            Stop rewriting your resume from scratch. Narrative extracts your career achievements,
            builds a knowledge graph, and generates role-specific CVs that actually represent you.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
                Start Building Your Narrative
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-gray-800/50 rounded-xl p-6">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Upload Your History</h3>
            <p className="text-gray-400">
              Drop your existing CVs, PRDs, or career documents. We extract the facts.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Build Your Claims</h3>
            <p className="text-gray-400">
              Review, edit, and verify extracted achievements. Build your career truth.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Match to Roles</h3>
            <p className="text-gray-400">
              Paste a job description. Get a tailored resume that fits the role.
            </p>
          </div>
        </div>

        {/* Principles */}
        <div className="mt-32 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Our Principles</h2>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
              <h3 className="font-semibold text-lg mb-2">No Fabrication</h3>
              <p className="text-gray-400 text-sm">
                We never invent experience. Aggressive reframing is allowed. Lies are not.
              </p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
              <h3 className="font-semibold text-lg mb-2">Context Over Completeness</h3>
              <p className="text-gray-400 text-sm">
                Good CVs are intentionally incomplete. What you exclude matters.
              </p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
              <h3 className="font-semibold text-lg mb-2">Blunt Feedback</h3>
              <p className="text-gray-400 text-sm">
                We tell hard truths clearly. False encouragement destroys trust.
              </p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
              <h3 className="font-semibold text-lg mb-2">You Stay in Control</h3>
              <p className="text-gray-400 text-sm">
                The system proposes narratives. You choose the strategy.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 mt-24 border-t border-gray-800">
        <div className="text-center text-gray-500 text-sm">
          Built for senior professionals with complex careers.
        </div>
      </footer>
    </div>
  )
}
