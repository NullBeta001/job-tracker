"use client";

const rules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /\d/.test(p) },
  { label: "Symbol (!@#$...)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function getPasswordStrength(password: string) {
  const passed = rules.filter((r) => r.test(password)).length;
  return { passed, total: rules.length, allPassed: passed === rules.length };
}

const strengthLabels = ["", "Very weak", "Weak", "Fair", "Good", "Strong"];
const strengthColors = [
  "bg-border",
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-blue-500",
  "bg-emerald-500",
];

export default function PasswordStrength({ password }: { password: string }) {
  const { passed } = getPasswordStrength(password);

  if (!password) return null;

  return (
    <div className="mt-3 space-y-3">
      <div className="space-y-1.5">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
                i < passed ? strengthColors[passed] : "bg-border"
              }`}
            />
          ))}
        </div>
        <p className={`text-xs font-medium ${
          passed <= 1 ? "text-red-500" :
          passed <= 2 ? "text-orange-500" :
          passed <= 3 ? "text-amber-500" :
          passed <= 4 ? "text-blue-500" :
          "text-emerald-500"
        }`}>
          {strengthLabels[passed]}
        </p>
      </div>

      <ul className="space-y-1">
        {rules.map((rule) => {
          const met = rule.test(password);
          return (
            <li key={rule.label} className="flex items-center gap-2 text-xs">
              <span className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                met
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-border text-muted-foreground"
              }`}>
                {met ? (
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  <span className="w-1 h-1 rounded-full bg-current" />
                )}
              </span>
              <span className={met ? "text-foreground" : "text-muted-foreground"}>
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
