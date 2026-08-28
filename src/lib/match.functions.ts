import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type JobMatch = {
  rank: number;
  score: number;
  why: string;
  matched_skills: string[];
  missing_skills: string[];
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    remote: boolean;
    employment_type: string;
    salary_min: number | null;
    salary_max: number | null;
    seniority: string | null;
    required_skills: string[];
    description: string;
    external_url: string | null;
  };
};

export type MatchRun = {
  id: string;
  location: string;
  resume_filename: string | null;
  profile: {
    headline: string;
    current_title: string;
    years_experience: number;
    seniority: string;
    top_skills: string[];
    summary: string;
  };
  matches: JobMatch[];
  created_at: string;
};

const CreateInput = z.object({
  filename: z.string().min(1).max(255),
  fileBase64: z.string().min(100),
  location: z.string().min(2).max(120),
});

export const createMatchRun = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CreateInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI matching is not configured.");

    const { extractResumeText } = await import("./resume-text.server");
    const { fetchCandidateJobs } = await import("./jobs.server");
    const { matchWithAi } = await import("./ai-match.server");

    const resumeText = await extractResumeText(data.fileBase64, data.filename);
    const { candidates, locationMatched } = await fetchCandidateJobs(data.location);

    if (candidates.length === 0) {
      throw new Error("There are no open jobs in the database yet.");
    }

    const { profile, matches } = await matchWithAi({
      apiKey,
      resumeText,
      location: data.location,
      jobs: candidates,
    });

    const byId = new Map(candidates.map((job) => [job.id, job]));
    const seen = new Set<string>();
    const enriched: JobMatch[] = [];

    for (const match of matches) {
      const job = byId.get(match.job_id);
      if (!job || seen.has(job.id)) continue;
      seen.add(job.id);
      enriched.push({
        rank: enriched.length + 1,
        score: Math.max(0, Math.min(100, Math.round(match.score ?? 0))),
        why: (match.why ?? "").slice(0, 240),
        matched_skills: (match.matched_skills ?? []).slice(0, 5),
        missing_skills: (match.missing_skills ?? []).slice(0, 3),
        job: {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          remote: job.remote,
          employment_type: job.employment_type,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          seniority: job.seniority,
          required_skills: job.required_skills,
          description: job.description,
          external_url: job.external_url,
        },
      });
      if (enriched.length === 5) break;
    }

    if (enriched.length === 0) {
      throw new Error("AI matching couldn't rank these jobs. Please try again.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: run, error } = await supabaseAdmin
      .from("match_runs")
      .insert({
        location: data.location,
        resume_filename: data.filename,
        profile,
        matches: enriched,
      })
      .select("id")
      .single();

    if (error || !run) {
      console.error("failed to save match run", error);
      throw new Error("We found your matches but couldn't save them. Please try again.");
    }

    return { runId: run.id as string, locationMatched };
  });

export const getMatchRun = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ runId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: run, error } = await supabaseAdmin
      .from("match_runs")
      .select("id, location, resume_filename, profile, matches, created_at")
      .eq("id", data.runId)
      .maybeSingle();

    if (error) {
      console.error("failed to load match run", error);
      throw new Error("We couldn't load those results.");
    }
    if (!run) return null;

    return run as unknown as MatchRun;
  });
