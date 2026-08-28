export type JobRecord = {
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
  source: string;
  external_url: string | null;
};

/**
 * Single entry point for job listings. Today it reads the built-in database;
 * an external job API can be merged in here without touching the UI or the
 * matching logic.
 */
export async function fetchCandidateJobs(location: string): Promise<{
  candidates: JobRecord[];
  locationMatched: boolean;
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select(
      "id, title, company, location, remote, employment_type, salary_min, salary_max, seniority, required_skills, description, source, external_url",
    )
    .eq("is_active", true)
    .limit(500);

  if (error) {
    console.error("failed to load jobs", error);
    throw new Error("We couldn't load job listings right now. Please try again.");
  }

  const all = (data ?? []) as JobRecord[];
  const tokens = location
    .toLowerCase()
    .split(/[,/|]| - /)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);

  const wantsRemote = /remote|anywhere|work from home/i.test(location);

  const local = all.filter((job) => {
    if (job.remote) return true;
    const jobLocation = job.location.toLowerCase();
    return tokens.some((token) => jobLocation.includes(token) || token.includes(jobLocation));
  });

  const locationMatched = local.some((job) => !job.remote) || (wantsRemote && local.length > 0);

  return {
    candidates: local.length >= 5 ? local : all,
    locationMatched,
  };
}
