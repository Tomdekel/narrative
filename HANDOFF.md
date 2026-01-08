# Narrative - Project Handoff Document

## Project Overview
**Narrative** is a career management application that helps users create tailored resumes by:
1. Uploading career documents (CV, pitch decks, etc.)
2. Extracting "claims" (achievements, skills, responsibilities)
3. Targeting specific job roles
4. Generating tailored resumes that match role requirements

**Stack:** Next.js 14 (App Router), Supabase, OpenAI, Vercel

**Live URL:** https://narrative-omega.vercel.app

---

## Recent Progress (Jan 7, 2026)

### NEW - Strategic Career Analysis Feature
Added ChatGPT-level strategic career analysis with brutally honest insights from a hiring manager's perspective.

**What it provides:**
- **Role Deconstruction**: What the JD actually means vs what it says
- **Company View**: How hiring managers will perceive your application (first impression, strengths, weaknesses, likely objections)
- **Hard Truths**: Seniority fit, trajectory concerns, unhideable gaps
- **Signal Strategy**: What to amplify, what to downplay, your positioning narrative
- **Next Steps**: Stories to prepare, positioning advice, pre-application checklist

**Files created:**
- `/src/app/api/strategic-assessment/route.ts` - API endpoint
- `/src/lib/openai/prompts/strategic-assessment.ts` - Senior recruiter persona prompt
- `/src/components/features/roles/strategic-assessment.tsx` - Main container component
- `/src/components/features/roles/strategic/` - Sub-components:
  - `expandable-section.tsx` - Collapsible section UI
  - `assessment-summary.tsx` - Always-visible net assessment
  - `role-deconstruction.tsx` - JD analysis
  - `company-view.tsx` - Hiring manager perspective
  - `hard-truths.tsx` - Career gaps and concerns
  - `signal-strategy.tsx` - Positioning advice
  - `next-steps.tsx` - Action items

**Files modified:**
- `/src/server/services/resume-pipeline/types.ts` - Added `StrategicAssessment` types
- `/src/app/(dashboard)/dashboard/roles/[id]/page.tsx` - Integrated strategic analysis UI

**Database:**
- Added `strategic_assessment` JSONB column to `role_intents` table (cached results)

---

### Completed - Multi-Step Resume Pipeline
Replaced single-prompt resume generation with a 4-step pipeline:

```
Step 1: Parse CV Structure (GPT-4o-mini)
   → { contact, experience[], education[], skills[] }

Step 2: Attribute Claims to Jobs (GPT-4o-mini)
   → Map each claim to the job it belongs to

Step 3: Analyze Role & Narrative (GPT-4o)
   → { narrative_angle, emphasis_points, title_suggestions }

Step 4: Compose Final CV (GPT-4o)
   → Complete structured resume
```

**Files created:**
- `/src/server/services/resume-pipeline/index.ts` - Orchestrator
- `/src/server/services/resume-pipeline/step1-parse-cv.ts`
- `/src/server/services/resume-pipeline/step2-attribute-claims.ts`
- `/src/server/services/resume-pipeline/step3-analyze-role.ts`
- `/src/server/services/resume-pipeline/step4-compose.ts`
- `/src/server/services/resume-pipeline/types.ts`

**Files modified:**
- `/src/app/api/resume/generate/route.ts` - Uses pipeline
- `/src/app/api/resume/revise/route.ts` - Works with new schema
- `/src/app/(dashboard)/dashboard/roles/[id]/generate/page.tsx` - CV display UI

---

## Recently Fixed Issues (Jan 7, 2026)

### Issue 1: Education Section Broken - FIXED
**Symptom:** Was showing "null" values in education entries.

**Fix applied:**
- `step1-parse-cv.ts` - Added instructions to never output nulls, use descriptive text instead
- `step4-compose.ts` - Added filtering to remove entries containing null values

---

### Issue 2: User Guidelines Ignored - FIXED
**Symptom:** User guidelines were being overlooked by the model.

**Fix applied:**
- `step4-compose.ts` - Moved guidelines from user prompt to SYSTEM prompt with "MANDATORY" label

---

### Issue 3: Sidebar "Tailored Resumes" Link Broken - FIXED
**Symptom:** Link was redirecting unexpectedly.

**Fix applied:**
- `/src/components/layout/sidebar.tsx` - Changed href from `/dashboard/resumes` to `/dashboard/roles`

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `/src/server/services/resume-pipeline/` | Resume generation pipeline |
| `/src/app/api/resume/generate/route.ts` | Resume generation API endpoint |
| `/src/app/api/strategic-assessment/route.ts` | Strategic career analysis API |
| `/src/app/(dashboard)/dashboard/roles/[id]/page.tsx` | Role detail page with analysis |
| `/src/app/(dashboard)/dashboard/roles/[id]/generate/page.tsx` | UI for generated resume |
| `/src/components/features/roles/strategic-assessment.tsx` | Strategic analysis UI |
| `/src/lib/openai/prompts/strategic-assessment.ts` | Recruiter persona prompt |
| `/src/components/layout/sidebar.tsx` | Navigation sidebar |
| `/src/middleware.ts` | Route redirects |
| `/src/app/api/fit-analysis/route.ts` | Role fit analysis |
| `/src/app/api/jd-fetch/route.ts` | Job description URL fetching |

---

## Database (Supabase)

**Project ID:** `yshpyoiqywgpfwcuyanb`

Key tables:
- `artifacts` - Uploaded documents with extracted text
- `claims` - Extracted career claims (achievements, skills, etc.)
- `role_intents` - Target job roles with requirements
- `user_career_context` - User's career narrative and guidelines
- `positions` - Work history (currently empty, parsed dynamically)

---

## Environment

Required env vars in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

---

## Completed (Jan 7, 2026)

1. ~~**Fix education parsing**~~ - DONE (multiple iterations to catch null, undefined, optional, etc.)
2. ~~**Enforce user guidelines**~~ - DONE (moved to SYSTEM prompt with MANDATORY label)
3. ~~**Fix sidebar link**~~ - DONE (both links now go to /dashboard/roles)
4. ~~**Deploy to production**~~ - DONE (deployed to https://narrative-omega.vercel.app)
5. ~~**Test resume generation**~~ - DONE (verified guidelines working, education filtering improved)
6. ~~**Strategic Career Analysis**~~ - DONE (full implementation with 5 analysis sections)

## Known Remaining Issues

- Education section still shows some placeholder values from the original CV parsing
- The CV parser sometimes outputs "Data Science Program" as institution name instead of actual school
- Model sometimes invents placeholder years like "Graduated" or "Completed" (now filtered in UI)

## Next Steps

1. **Deploy Strategic Analysis** - Push to production and test with real users
2. **Improve CV parsing** - Better extraction of education data from source CV
3. **Feed strategic insights into resume generation** - Use signal strategy to enhance Step 4 compose
4. **Add education year extraction** - Parse actual graduation years from CV text

---

## Detailed Plan Files
- `/Users/tomdekel/.claude/plans/serene-swimming-sutton.md` - Original resume pipeline plan
- `/Users/tomdekel/.claude/plans/wondrous-painting-wall.md` - Strategic analysis feature plan
