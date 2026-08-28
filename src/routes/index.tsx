import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";

import { Wordmark } from "@/components/Wordmark";
import { createMatchRun } from "@/lib/match.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fivefold — Upload your resume, get your 5 best job matches" },
      {
        name: "description",
        content:
          "Upload a PDF or DOCX resume, enter your city, and get the five most compatible open jobs ranked by AI with match scores and reasoning.",
      },
      { property: "og:title", content: "Fivefold — Your 5 best job matches, from one resume" },
      {
        property: "og:description",
        content:
          "AI reads your resume and ranks the five open roles you fit best, with a score and reasoning for each.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UploadPage,
});

const ACCEPTED = [".pdf", ".docx"];

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });
}

function UploadPage() {
  const navigate = useNavigate();
  const runMatch = useServerFn(createMatchRun);
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [location, setLocation] = useState("");
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function acceptFile(next: File | undefined) {
    if (!next) return;
    const ok = ACCEPTED.some((ext) => next.name.toLowerCase().endsWith(ext));
    if (!ok) {
      setError("Please upload a PDF or DOCX resume.");
      return;
    }
    if (next.size > 10 * 1024 * 1024) {
      setError("That file is larger than 10 MB. Please upload a smaller resume.");
      return;
    }
    setError(null);
    setFile(next);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file || !location.trim() || pending) return;

    setPending(true);
    setError(null);
    try {
      const fileBase64 = await readAsBase64(file);
      const result = await runMatch({
        data: { filename: file.name, fileBase64, location: location.trim() },
      });
      navigate({ to: "/matches/$runId", params: { runId: result.runId } });
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : "Something went wrong. Please try again.",
      );
      setPending(false);
    }
  }

  const ready = Boolean(file) && location.trim().length > 1;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-border pb-6">
          <Wordmark />
          <span className="label-caps hidden text-muted-foreground sm:block">
            No account needed
          </span>
        </header>

        <div className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
          <section>
            <p className="label-caps text-primary">Resume intake</p>
            <h1 className="font-display mt-4 text-5xl leading-[1.05] text-foreground sm:text-6xl">
              Five jobs.
              <br />
              Ranked for <em className="text-primary">you</em>.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              Hand us your resume and the city you want to work in. Our AI reads the whole document,
              weighs it against every open role we track, and lays out the five strongest fits — with
              a score and a reason for each.
            </p>

            <ol className="mt-10 space-y-4 border-l border-border pl-6">
              {[
                ["01", "Upload", "PDF or DOCX, parsed on our server and never stored."],
                ["02", "Locate", "Tell us your city, or say remote."],
                ["03", "Review", "Five ranked matches with scores and skill gaps."],
              ].map(([num, title, copy]) => (
                <li key={num} className="relative">
                  <span className="label-caps absolute -left-[1.9rem] top-1 bg-background py-0.5 text-muted-foreground">
                    {num}
                  </span>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground">{copy}</p>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <form
              onSubmit={handleSubmit}
              className="rounded-lg border border-border bg-card p-6 shadow-[0_1px_0_0_var(--color-border),0_18px_40px_-32px_rgba(0,0,0,0.5)] sm:p-8"
            >
              <p className="label-caps text-muted-foreground">Step 1 — Resume</p>

              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  acceptFile(event.dataTransfer.files?.[0]);
                }}
                onClick={() => inputRef.current?.click()}
                className={`mt-3 cursor-pointer rounded-md border-2 border-dashed p-8 text-center transition-all ${
                  dragging
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : file
                      ? "border-primary/60 bg-primary/5"
                      : "border-border paper-grain hover:border-primary/50"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="sr-only"
                  onChange={(event) => acceptFile(event.target.files?.[0])}
                />
                {file ? (
                  <>
                    <p className="font-display text-xl text-foreground">{file.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(0)} KB · click to replace
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-display text-xl text-foreground">Drop your resume here</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      or click to browse · PDF or DOCX · up to 10 MB
                    </p>
                  </>
                )}
              </div>

              <label htmlFor="location" className="label-caps mt-8 block text-muted-foreground">
                Step 2 — Location
              </label>
              <input
                id="location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="e.g. Austin, TX or Remote"
                className="mt-3 w-full rounded-md border border-input bg-background px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/25"
              />

              {error ? (
                <p
                  role="alert"
                  className="mt-5 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={!ready || pending}
                className="mt-7 w-full rounded-md bg-primary px-5 py-3.5 text-sm font-semibold tracking-wide text-primary-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pending ? "Reading your resume…" : "Find my top 5 matches"}
              </button>

              {pending ? (
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Parsing the document and scoring every open role. This takes a few seconds.
                </p>
              ) : null}
            </form>
          </section>
        </div>

        <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
          Your resume is parsed in memory to generate matches and is not stored.
        </footer>
      </div>
    </main>
  );
}
