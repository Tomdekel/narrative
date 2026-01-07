'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { addClaimVariant, removeClaimVariant } from '@/server/actions/claims'

type Props = {
  claimId: string
  canonicalText: string
  initialVariants: string[]
}

export function VariantsManager({ claimId, canonicalText, initialVariants }: Props) {
  const [variants, setVariants] = useState<string[]>(initialVariants || [])
  const [isAdding, setIsAdding] = useState(false)
  const [newVariant, setNewVariant] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!newVariant.trim()) return

    setSaving(true)
    const result = await addClaimVariant(claimId, newVariant.trim())
    setSaving(false)

    if (result.success) {
      setVariants([...variants, newVariant.trim()])
      setNewVariant('')
      setIsAdding(false)
    }
  }

  const handleRemove = async (index: number) => {
    setSaving(true)
    const result = await removeClaimVariant(claimId, index)
    setSaving(false)

    if (result.success) {
      setVariants(variants.filter((_, i) => i !== index))
    }
  }

  const handleUseAsCanonical = (variant: string) => {
    // This would swap the variant with canonical - implement if needed
    console.log('Use as canonical:', variant)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Variants</CardTitle>
        {!isAdding && (
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            Add Variant
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isAdding && (
          <div className="mb-4 space-y-3">
            <textarea
              value={newVariant}
              onChange={(e) => setNewVariant(e.target.value)}
              placeholder={`Alternative phrasing of: "${canonicalText.slice(0, 50)}..."`}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
              rows={2}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={saving || !newVariant.trim()}>
                {saving ? 'Adding...' : 'Add'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAdding(false)
                  setNewVariant('')
                }}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {variants.length > 0 ? (
          <div className="space-y-2">
            {variants.map((variant, index) => (
              <div
                key={index}
                className="group flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <p className="text-gray-700 text-sm flex-1">{variant}</p>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUseAsCanonical(variant)}
                    className="text-xs"
                  >
                    Use
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(index)}
                    disabled={saving}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !isAdding && (
            <p className="text-gray-500 text-sm">
              No variants yet. Create alternative phrasings for different contexts.
            </p>
          )
        )}
      </CardContent>
    </Card>
  )
}
