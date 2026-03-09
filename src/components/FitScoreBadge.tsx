"use client";

export default function FitScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-muted-foreground">N/A</span>;

  let style = "bg-red-500/10 text-red-700 dark:text-red-400 ring-red-500/20";
  if (score >= 80) style = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20";
  else if (score >= 60) style = "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 ring-yellow-500/20";
  else if (score >= 40) style = "bg-orange-500/10 text-orange-700 dark:text-orange-400 ring-orange-500/20";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${style}`}>
      {score}%
    </span>
  );
}
