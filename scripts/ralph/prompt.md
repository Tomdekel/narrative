# Ralph Agent Instructions for Narrative

## Project Context

Narrative is a career narrative system that generates role-specific CVs.
Core concept: Claims are first-class objects. Everything else supports Claims.
This is NOT a resume editor - it's a claim system that outputs documents.

## Tech Stack
- Frontend + API: Next.js on Vercel
- Database: Supabase Postgres
- Auth: Supabase Auth
- File storage: Supabase Storage
- Vectors: pgvector
- DO NOT use Neo4j

## Your Task

1. Read `scripts/ralph/prd.json`
2. Read `scripts/ralph/progress.txt` (check Codebase Patterns first)
3. Ensure you're on the branch from prd.json
4. Pick highest priority story where `passes: false`
5. Implement that ONE story only
6. Run typecheck: `npm run typecheck`
7. Commit: `feat: [ID] - [Title]`
8. Update prd.json: set `passes: true`
9. Append learnings to progress.txt

## Key Principles (from PRD)
- No fabrication - never invent experience
- Claims are central, user-editable, evidence-backed
- Deterministic ranking over prompt magic
- Every resume bullet traceable to Claims + Evidence

## Progress Format

APPEND to progress.txt:

---
## [Date] - [Story ID]
- What was implemented
- Files changed
- **Learnings:**
  - Patterns discovered
  - Gotchas encountered

## Stop Condition

If ALL stories have `passes: true`, reply exactly:
<promise>COMPLETE</promise>

Otherwise, end normally after completing one story.
