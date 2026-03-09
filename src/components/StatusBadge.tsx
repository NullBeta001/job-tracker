"use client";

const statusStyles: Record<string, string> = {
  Applied: "bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-blue-500/20",
  "Recruiter Screen": "bg-purple-500/10 text-purple-700 dark:text-purple-400 ring-purple-500/20",
  "Technical Interview": "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 ring-indigo-500/20",
  "System Design": "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 ring-cyan-500/20",
  "Final Interview": "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20",
  Offer: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20",
  Rejected: "bg-red-500/10 text-red-700 dark:text-red-400 ring-red-500/20",
  Ghosted: "bg-gray-500/10 text-gray-500 dark:text-gray-400 ring-gray-500/20",
};

export default function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] || "bg-gray-500/10 text-gray-600 dark:text-gray-400 ring-gray-500/20";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${style}`}>
      {status}
    </span>
  );
}
