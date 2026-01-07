'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { updateClaimText } from '@/server/actions/claims'

type Props = {
  claimId: string
  initialText: string
}

export function ClaimEditor({ claimId, initialText }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(initialText)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (text.trim() === initialText) {
      setIsEditing(false)
      return
    }

    setSaving(true)
    const result = await updateClaimText(claimId, text.trim())
    setSaving(false)

    if (result.success) {
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setText(initialText)
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <div className="group">
        <h1 className="text-2xl font-bold text-gray-900 inline">{text}</h1>
        <button
          onClick={() => setIsEditing(true)}
          className="ml-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
        >
          <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        rows={3}
        autoFocus
      />
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button variant="outline" onClick={handleCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
