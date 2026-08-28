import { Link } from "@tanstack/react-router";

export function Wordmark() {
  return (
    <Link to="/" className="group inline-flex items-baseline gap-2">
      <span className="font-display text-2xl leading-none text-foreground">Fivefold</span>
      <span className="label-caps text-muted-foreground transition-colors group-hover:text-primary">
        Resume → 5 jobs
      </span>
    </Link>
  );
}
