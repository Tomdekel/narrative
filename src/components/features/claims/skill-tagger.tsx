'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { addSkillToClaim, removeSkillFromClaim } from '@/server/actions/claims'

type Skill = {
  id: string
  name: string
  category: string
}

type ClaimSkill = {
  id: string
  skills: Skill | null
}

type Props = {
  claimId: string
  initialSkills: ClaimSkill[]
}

export function SkillTagger({ claimId, initialSkills }: Props) {
  const [skills, setSkills] = useState<ClaimSkill[]>(initialSkills || [])
  const [isAdding, setIsAdding] = useState(false)
  const [newSkill, setNewSkill] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!newSkill.trim()) return

    setSaving(true)
    const result = await addSkillToClaim(claimId, newSkill.trim())
    setSaving(false)

    if (result.success && result.skillId) {
      setSkills([
        ...skills,
        {
          id: crypto.randomUUID(),
          skills: { id: result.skillId, name: newSkill.trim(), category: 'user_added' },
        },
      ])
      setNewSkill('')
      setIsAdding(false)
    }
  }

  const handleRemove = async (claimSkillId: string, skillId: string) => {
    setSaving(true)
    const result = await removeSkillFromClaim(claimId, skillId)
    setSaving(false)

    if (result.success) {
      setSkills(skills.filter((s) => s.id !== claimSkillId))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Related Skills</CardTitle>
        {!isAdding && (
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            Add Skill
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isAdding && (
          <div className="mb-4 space-y-3">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., React, Python, Project Management"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={saving || !newSkill.trim()}>
                {saving ? 'Adding...' : 'Add'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAdding(false)
                  setNewSkill('')
                }}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map(
              (cs) =>
                cs.skills && (
                  <span
                    key={cs.id}
                    className="group inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                  >
                    {cs.skills.name}
                    <button
                      onClick={() => handleRemove(cs.id, cs.skills!.id)}
                      disabled={saving}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-purple-900"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                )
            )}
          </div>
        ) : (
          !isAdding && <p className="text-gray-500 text-sm">No skills linked</p>
        )}
      </CardContent>
    </Card>
  )
}
