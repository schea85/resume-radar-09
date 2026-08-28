import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";

import { Wordmark } from "@/components/Wordmark";
import { getMatchRun, type JobMatch } from "@/lib/match.functions";

export const Route = createFileRoute("/matches/$runId")({
  loader: async ({ params }) => {
    const run = await getMatchRun({ data: { runId: params.runId } });
    if (!run) throw notFound();
    return run;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Results unavailable — Fivefold" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `Top 5 job matches in ${loaderData.location} — Fivefold`;
    const description = `AI-ranked job matches for a ${loaderData.profile.headline} searching in ${loaderData.location}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "noindex" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: MatchesPage,
});

function salaryLabel(min: number | null, max: number | null) {
  if (!min || !max) return null;
  const fmt = (value: number) => `$${Math.round(value / 1000)}k`;
  return `${fmt(min)} – ${fmt(max)}`;
}

function ScoreDial({ score, large }: { score: number; large?: boolean }) {
  const size = large ? 92 : 64;
  const stroke = large ? 7 : 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          className="stroke-primary transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-display leading-none ${large ? "text-3xl" : "text-xl"}`}>
          {score}
        </span>
        {large ? <span className="label-caps mt-1 text-muted-foreground">fit</span> : null}
      </div>
    </div>
  );
}

function SkillChips({
  label,
  skills,
  tone,
}: {
  label: string;
  skills: string[];
  tone: "match" | "gap";
}) {
  if (skills.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="label-caps text-muted-foreground">{label}</span>
      {skills.map((skill) => (
        <span
          key={skill}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            tone === "match"
              ? "bg-primary/10 text-primary"
              : "border border-dashed border-border text-muted-foreground"
          }`}
        >
          {skill}
        </span>
      ))}
    </div>
  );
}

function MatchCard({ match, featured }: { match: JobMatch; featured?: boolean }) {
  const [open, setOpen] = useState(false);
  const salary = salaryLabel(match.job.salary_min, match.job.salary_max);

  return (
    <article
      className={`rounded-lg border bg-card transition-colors ${
        featured ? "border-primary/40 p-7 sm:p-9" : "border-border p-6"
      }`}
    >
      <div className="flex items-start gap-5">
        <span
          className={`font-display leading-none text-muted-foreground ${
            featured ? "text-4xl" : "text-2xl"
          }`}
        >
          {String(match.rank).padStart(2, "0")}
        </span>

        <div className="min-w-0 flex-1">
          {featured ? (
            <p className="label-caps mb-2 text-accent-foreground">
              <span className="rounded-sm bg-accent px-2 py-1">Strongest fit</span>
            </p>
          ) : null}
          <h2
            className={`font-display text-foreground ${featured ? "text-3xl sm:text-4xl" : "text-2xl"}`}
          >
            {match.job.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {match.job.company} · {match.job.location}
            {match.job.remote ? " · Remote-friendly" : ""}
            {salary ? ` · ${salary}` : ""}
            {match.job.seniority ? ` · ${match.job.seniority}` : ""}
          </p>

          <p
            className={`mt-4 text-foreground ${featured ? "text-lg leading-relaxed" : "text-sm leading-relaxed"}`}
          >
            {match.why}
          </p>

          <div className="mt-5 space-y-3">
            <SkillChips label="Strengths" skills={match.matched_skills} tone="match" />
            <SkillChips label="Gaps" skills={match.missing_skills} tone="gap" />
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="mt-5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            {open ? "Hide full description" : "Read full description"}
          </button>

          {open ? (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {match.job.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {match.job.required_skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              {match.job.external_url ? (
                <a
                  href={match.job.external_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  View original posting →
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        <ScoreDial score={match.score} large={featured ?? false} />
      </div>
    </article>
  );
}

function MatchesPage() {
  const run = Route.useLoaderData();
  const [top, ...rest] = run.matches;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-4xl px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-border pb-6">
          <Wordmark />
          <Link
            to="/"
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            New search
          </Link>
        </header>

        <section className="py-10">
          <p className="label-caps text-primary">Match report</p>
          <h1 className="font-display mt-3 text-4xl leading-tight text-foreground sm:text-5xl">
            {run.profile.headline}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {run.profile.summary}
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
            {[
              ["Searching", run.location],
              ["Current title", run.profile.current_title || "—"],
              [
                "Experience",
                run.profile.years_experience ? `${run.profile.years_experience} yrs` : "—",
              ],
              ["Level", run.profile.seniority || "—"],
            ].map(([label, value]) => (
              <div key={label} className="bg-card p-4">
                <dt className="label-caps text-muted-foreground">{label}</dt>
                <dd className="mt-1 truncate text-sm font-semibold text-foreground">{value}</dd>
              </div>
            ))}
          </dl>

          {run.profile.top_skills?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {run.profile.top_skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <section className="space-y-5 pb-16">
          {top ? <MatchCard match={top} featured /> : null}
          {rest.map((match) => (
            <MatchCard key={match.job.id} match={match} />
          ))}
        </section>

        <footer className="border-t border-border py-8 text-sm text-muted-foreground">
          Want to compare another city?{" "}
          <Link to="/" className="font-semibold text-primary underline-offset-4 hover:underline">
            Run a new search
          </Link>
          .
        </footer>
      </div>
    </main>
  );
}
