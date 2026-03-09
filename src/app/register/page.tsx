"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import PasswordStrength, { getPasswordStrength } from "@/components/PasswordStrength";
import { GoogleIcon } from "@/components/Icons";

const inputClass =
  "w-full bg-input-bg border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { allPassed } = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword;
  const canSubmit = allPassed && passwordsMatch && confirmPassword.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    router.push("/login");
  }

  function handleGoogleSignIn() {
    signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start tracking your job applications</p>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2.5 bg-input-bg border border-border rounded-lg py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <GoogleIcon className="w-4.5 h-4.5" />
            Continue with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground">or continue with email</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg mb-4 ring-1 ring-inset ring-red-500/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                required
              />
              <PasswordStrength password={password} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`${inputClass} ${
                  confirmPassword && !passwordsMatch
                    ? "ring-2 ring-red-500 border-transparent"
                    : confirmPassword && passwordsMatch
                    ? "ring-2 ring-emerald-500 border-transparent"
                    : ""
                }`}
                required
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
              )}
              {confirmPassword && passwordsMatch && (
                <p className="text-xs text-emerald-500 mt-1.5">Passwords match</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-sm text-center mt-6 text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
