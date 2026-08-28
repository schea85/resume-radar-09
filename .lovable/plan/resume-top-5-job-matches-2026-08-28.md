# Resume → Top 5 Job Matches

Upload a resume (PDF or DOCX), enter a location, and AI ranks the 5 most compatible jobs from a built-in job database, with a match score and reasoning for each.

## User flow

1. Landing page: headline, upload dropzone (PDF/DOCX), location input, "Find my matches" button.
2. Parsing state: resume text is extracted, skills/titles/experience summarized.
3. Results page: top 5 job cards, each with title, company, location, salary range, match score (0-100), a short "why this fits" explanation, and skill-gap notes.
4. Each card expands to full job description. Result can be re-run with a different location.

## Backend (Lovable Cloud)

- `jobs` table: title, company, location, remote flag, employment type, salary min/max, description, required skills, seniority, source (`internal` by default), external_id/external_url (nullable, ready for future API imports).
- Seeded with a solid set of realistic jobs across engineering, design, marketing, data, ops, and support, spread over major US metros plus remote — enough variety that matching is meaningful.
- Public read access only; no writes from the client.
- Job fetching goes through a single provider module so an external job API can be added later without touching the UI.

## AI matching

- Server function extracts text from the uploaded file (PDF and DOCX parsed server-side), then calls Lovable AI to produce a structured resume profile (titles, skills, years of experience, seniority).
- Candidate jobs are pre-filtered by location (city match + remote), then a second AI call scores and ranks them, returning the top 5 with score, reasoning, and matched/missing skills.
- Errors (unreadable file, no jobs in that location, AI unavailable) surface as clear in-app messages.

## Left open for later

- Accounts: no sign-in now, but results are modeled as a standalone "match run" so saving history per user is an additive change.
- External jobs: schema and provider layer already accommodate imported postings.

## Technical notes

- TanStack Start routes: `/` (upload) and `/matches/$runId` (results).
- Resume file is parsed in a server function and not persisted; only the derived profile and match run are stored.
- Design direction will be proposed as rendered options before building the UI.
