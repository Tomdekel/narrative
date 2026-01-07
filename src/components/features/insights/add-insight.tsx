'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClaim } from '@/server/actions/claims'
import { toast } from 'sonner'

const claimTypes = [
  { value: 'achievement', label: 'Achievement', color: 'bg-green-100 text-green-700' },
  { value: 'responsibility', label: 'Responsibility', color: 'bg-blue-100 text-blue-700' },
  { value: 'skill', label: 'Skill', color: 'bg-purple-100 text-purple-700' },
  { value: 'credential', label: 'Credential', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'context', label: 'Context', color: 'bg-gray-100 text-gray-700' },
] as const

export function AddInsight() {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState('')
  const [type, setType] = useState<typeof claimTypes[number]['value']>('achievement')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!text.trim()) {
      toast.error('Please enter insight text')
      return
    }

    startTransition(async () => {
      const result = await createClaim(text.trim(), type)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Insight added')
        setText('')
        setType('achievement')
        setIsOpen(false)
      }
    })
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full border-dashed"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Insight Manually
      </Button>
    )
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Insight Type
            </label>
            <div className="flex flex-wrap gap-2">
              {claimTypes.map((ct) => (
                <button
                  key={ct.value}
                  type="button"
                  onClick={() => setType(ct.value)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    type === ct.value
                      ? ct.color + ' ring-2 ring-offset-2 ring-gray-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Insight
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="E.g., 'Led a team of 5 engineers to deliver a new payment system that increased conversion by 25%'"
              className="w-full p-3 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              autoFocus
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsOpen(false)
                setText('')
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !text.trim()}>
              {isPending ? 'Adding...' : 'Add Insight'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
