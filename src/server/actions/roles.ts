'use server'

import { createClient } from '@/lib/supabase/server'
import { parseRoleIntent, generateEmbedding } from '@/lib/openai/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createRoleIntent(jobDescription: string, roleTitle?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  try {
    // Parse the job description with AI
    const parsed = await parseRoleIntent(jobDescription)

    // Generate embedding for the job description
    let embedding = null
    try {
      embedding = await generateEmbedding(jobDescription.slice(0, 8000))
    } catch (e) {
      console.warn('Failed to generate role embedding:', e)
    }

    // Insert role intent
    const { data: roleIntent, error } = await supabase
      .from('role_intents')
      .insert({
        user_id: user.id,
        title_raw: roleTitle || parsed.role_title,
        company_raw: parsed.company_name,
        raw_jd: jobDescription,
        must_haves: parsed.must_haves,
        nice_to_haves: parsed.nice_to_haves,
        implicit_signals: parsed.implicit_signals,
        level_inferred: parsed.seniority_level,
        function_inferred: parsed.role_type,
        domain: parsed.domain,
        embedding,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating role intent:', error)
      return { error: error.message }
    }

    // Link skills from requirements
    const allSkills = [
      ...parsed.must_haves.map((r) => ({ skill: r.skill, required: true })),
      ...parsed.nice_to_haves.map((r) => ({ skill: r.skill, required: false })),
    ]

    for (const { skill: skillName, required } of allSkills) {
      // Find or create skill
      let { data: skill } = await supabase
        .from('skills')
        .select('id')
        .eq('name', skillName)
        .single()

      if (!skill) {
        const { data: newSkill } = await supabase
          .from('skills')
          .insert({ name: skillName, category: 'extracted' })
          .select('id')
          .single()
        skill = newSkill
      }

      if (skill) {
        await supabase.from('roleintent_skill').insert({
          role_intent_id: roleIntent.id,
          skill_id: skill.id,
          is_required: required,
        })
      }
    }

    revalidatePath('/dashboard/roles')
    return { success: true, roleIntentId: roleIntent.id }
  } catch (error) {
    console.error('Error parsing job description:', error)
    return { error: 'Failed to parse job description. Please try again.' }
  }
}

export async function deleteRoleIntent(roleIntentId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('role_intents')
    .delete()
    .eq('id', roleIntentId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/roles')
  return { success: true }
}
