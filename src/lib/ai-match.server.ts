import type { JobRecord } from "./jobs.server";

export type ResumeProfile = {
  headline: string;
  current_title: string;
  years_experience: number;
  seniority: string;
  top_skills: string[];
  summary: string;
};

export type RawMatch = {
  job_id: string;
  score: number;
  why: string;
  matched_skills: string[];
  missing_skills: string[];
};

export type MatchPayload = { profile: ResumeProfile; matches: RawMatch[] };

const MODEL = "google/gemini-3.7-flash";

const SYSTEM_PROMPT = `You are an expert technical recruiter. You read a candidate's resume and a list of open jobs, then pick the five jobs the candidate is most compatible with.

Rules:
- Only pick jobs from the provided list, using their exact job_id values.
- Return exactly five matches, ordered best first, with no duplicates.
- score is an integer 0-100 reflecting genuine fit (skills, seniority, domain, location). Be discerning: reserve 90+ for near-perfect fits and use the full range.
- why is one specific sentence (max 200 characters) about this candidate and this job. Never generic filler.
- matched_skills: up to 5 skills the candidate clearly demonstrates that the job wants.
- missing_skills: up to 3 job requirements the candidate does not evidence. Empty array if none.
- Respond with JSON only, no markdown fences.`;

function jobDigest(job: JobRecord) {
  return {
    job_id: job.id,
    title: job.title,
    company: job.company,
    location: job.remote ? `${job.location} (remote-friendly)` : job.location,
    seniority: job.seniority,
    employment_type: job.employment_type,
    salary: job.salary_min && job.salary_max ? `$${job.salary_min}-$${job.salary_max}` : null,
    required_skills: job.required_skills,
    description: job.description.slice(0, 600),
  };
}

export async function matchWithAi(input: {
  apiKey: string;
  resumeText: string;
  location: string;
  jobs: JobRecord[];
}): Promise<MatchPayload> {
  const userPrompt = [
    `Candidate location preference: ${input.location}`,
    "",
    "RESUME:",
    input.resumeText,
    "",
    "OPEN JOBS (JSON):",
    JSON.stringify(input.jobs.map(jobDigest)),
    "",
    'Respond with JSON shaped exactly as: {"profile":{"headline":string,"current_title":string,"years_experience":number,"seniority":string,"top_skills":string[],"summary":string},"matches":[{"job_id":string,"score":number,"why":string,"matched_skills":string[],"missing_skills":string[]}]}',
    "headline is a short professional label for the candidate (e.g. 'Mid-level frontend engineer'). summary is at most two sentences.",
  ].join("\n");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": input.apiKey,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("AI gateway error", response.status, body);
    if (response.status === 429) {
      throw new Error("The matching service is busy right now. Please try again in a moment.");
    }
    if (response.status === 402 || response.status === 403) {
      throw new Error(
        "AI matching is unavailable because this workspace is out of AI credits. Add credits in Lovable to continue.",
      );
    }
    throw new Error("AI matching failed. Please try again.");
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content ?? "";
  const cleaned = content.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  let parsed: MatchPayload;
  try {
    parsed = JSON.parse(cleaned) as MatchPayload;
  } catch {
    console.error("unparseable AI response", content.slice(0, 500));
    throw new Error("AI matching returned an unexpected response. Please try again.");
  }

  if (!parsed?.matches?.length) {
    throw new Error("AI matching couldn't rank these jobs. Please try again.");
  }

  return parsed;
}
