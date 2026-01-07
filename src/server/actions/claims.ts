'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateClaimText(claimId: string, canonicalText: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('claims')
    .update({ canonical_text: canonicalText })
    .eq('id', claimId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/claims/${claimId}`)
  revalidatePath('/dashboard/claims')
  revalidatePath('/dashboard/insights')
  return { success: true }
}

export async function updateClaimStatus(
  claimId: string,
  truthStatus: 'unverified' | 'verified' | 'disputed'
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('claims')
    .update({ truth_status: truthStatus })
    .eq('id', claimId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/claims/${claimId}`)
  revalidatePath('/dashboard/claims')
  return { success: true }
}

export async function addClaimVariant(claimId: string, variant: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Get current variants
  const { data: claim, error: fetchError } = await supabase
    .from('claims')
    .select('variants')
    .eq('id', claimId)
    .eq('user_id', user.id)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  const currentVariants = claim.variants || []
  const newVariants = [...currentVariants, variant]

  const { error } = await supabase
    .from('claims')
    .update({ variants: newVariants })
    .eq('id', claimId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/claims/${claimId}`)
  return { success: true }
}

export async function removeClaimVariant(claimId: string, variantIndex: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Get current variants
  const { data: claim, error: fetchError } = await supabase
    .from('claims')
    .select('variants')
    .eq('id', claimId)
    .eq('user_id', user.id)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  const currentVariants = claim.variants || []
  const newVariants = currentVariants.filter((_: string, i: number) => i !== variantIndex)

  const { error } = await supabase
    .from('claims')
    .update({ variants: newVariants })
    .eq('id', claimId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/claims/${claimId}`)
  return { success: true }
}

export async function addSkillToClaim(claimId: string, skillName: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Verify claim belongs to user
  const { data: claim, error: claimError } = await supabase
    .from('claims')
    .select('id')
    .eq('id', claimId)
    .eq('user_id', user.id)
    .single()

  if (claimError || !claim) {
    return { error: 'Claim not found' }
  }

  // Find or create skill
  let { data: skill } = await supabase
    .from('skills')
    .select('id')
    .eq('name', skillName)
    .single()

  if (!skill) {
    const { data: newSkill, error: skillError } = await supabase
      .from('skills')
      .insert({ name: skillName, category: 'user_added' })
      .select('id')
      .single()

    if (skillError) {
      return { error: skillError.message }
    }
    skill = newSkill
  }

  // Check if link already exists
  const { data: existing } = await supabase
    .from('claim_skill')
    .select('id')
    .eq('claim_id', claimId)
    .eq('skill_id', skill.id)
    .single()

  if (existing) {
    return { error: 'Skill already linked' }
  }

  // Create link
  const { error } = await supabase.from('claim_skill').insert({
    claim_id: claimId,
    skill_id: skill.id,
    proficiency_demonstrated: 'mentioned',
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/claims/${claimId}`)
  return { success: true, skillId: skill.id }
}

export async function removeSkillFromClaim(claimId: string, skillId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Verify claim belongs to user
  const { data: claim, error: claimError } = await supabase
    .from('claims')
    .select('id')
    .eq('id', claimId)
    .eq('user_id', user.id)
    .single()

  if (claimError || !claim) {
    return { error: 'Claim not found' }
  }

  const { error } = await supabase
    .from('claim_skill')
    .delete()
    .eq('claim_id', claimId)
    .eq('skill_id', skillId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/claims/${claimId}`)
  return { success: true }
}

export async function deleteClaim(claimId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('claims')
    .delete()
    .eq('id', claimId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/claims')
  revalidatePath('/dashboard/insights')
  return { success: true }
}

export async function createClaim(
  canonicalText: string,
  claimType: 'achievement' | 'responsibility' | 'skill' | 'credential' | 'context'
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: claim, error } = await supabase
    .from('claims')
    .insert({
      user_id: user.id,
      canonical_text: canonicalText,
      claim_type: claimType,
      evidence_strength: 'self_reported',
      confidence_score: 0.9,
      truth_status: 'unverified',
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/claims')
  revalidatePath('/dashboard/insights')
  return { success: true, claimId: claim.id }
}
