"use client";

import { useEffect, useState } from "react";
import { SectionHeader, Card, CardTitle, Button, PageLoading } from "@/components/ui";
import { PencilIcon, CheckCircleIcon, KeyIcon, BriefcaseIcon, ProfileIcon } from "@/components/Icons";

interface ProfileData {
  name: string;
  yearsOfExperience: number | null;
  primaryStack: string[];
  secondaryStack: string[];
  preferredRoles: string[];
  englishLevel: string | null;
  preferredSalaryMin: number | null;
  preferredSalaryMax: number | null;
  remotePreference: string | null;
  preferredCompanyStage: string | null;
  openaiApiKey: string | null;
}

const inputClass = "w-full bg-input-bg border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const labelClass = "block text-sm font-medium text-foreground mb-1.5";

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 py-2.5 border-b border-border last:border-0">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide sm:w-40 shrink-0">{label}</span>
      <span className="text-sm text-foreground">{value || <span className="text-muted-foreground italic">Not set</span>}</span>
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  if (items.length === 0) return <span className="text-sm text-muted-foreground italic">Not set</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2.5 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ring-blue-500/20">
          {item}
        </span>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: "",
    yearsOfExperience: "",
    primaryStack: "",
    secondaryStack: "",
    preferredRoles: "",
    englishLevel: "",
    preferredSalaryMin: "",
    preferredSalaryMax: "",
    remotePreference: "",
    preferredCompanyStage: "",
    openaiApiKey: "",
  });

  function loadFormFromProfile(data: ProfileData) {
    setForm({
      name: data.name || "",
      yearsOfExperience: data.yearsOfExperience?.toString() || "",
      primaryStack: (data.primaryStack || []).join(", "),
      secondaryStack: (data.secondaryStack || []).join(", "),
      preferredRoles: (data.preferredRoles || []).join(", "),
      englishLevel: data.englishLevel || "",
      preferredSalaryMin: data.preferredSalaryMin?.toString() || "",
      preferredSalaryMax: data.preferredSalaryMax?.toString() || "",
      remotePreference: data.remotePreference || "",
      preferredCompanyStage: data.preferredCompanyStage || "",
      openaiApiKey: data.openaiApiKey || "",
    });
  }

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: ProfileData) => {
        setProfile(data);
        loadFormFromProfile(data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name || null,
      yearsOfExperience: form.yearsOfExperience ? parseInt(form.yearsOfExperience) : null,
      primaryStack: form.primaryStack ? form.primaryStack.split(",").map((s) => s.trim()).filter(Boolean) : [],
      secondaryStack: form.secondaryStack ? form.secondaryStack.split(",").map((s) => s.trim()).filter(Boolean) : [],
      preferredRoles: form.preferredRoles ? form.preferredRoles.split(",").map((s) => s.trim()).filter(Boolean) : [],
      englishLevel: form.englishLevel || null,
      preferredSalaryMin: form.preferredSalaryMin ? parseInt(form.preferredSalaryMin) : null,
      preferredSalaryMax: form.preferredSalaryMax ? parseInt(form.preferredSalaryMax) : null,
      remotePreference: form.remotePreference || null,
      preferredCompanyStage: form.preferredCompanyStage || null,
      openaiApiKey: form.openaiApiKey || null,
    };

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const updated = await res.json();
    setProfile(updated);
    loadFormFromProfile(updated);
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleCancel() {
    if (profile) loadFormFromProfile(profile);
    setEditing(false);
  }

  if (loading) return <PageLoading />;

  const salaryDisplay =
    profile?.preferredSalaryMin
      ? `$${(profile.preferredSalaryMin / 1000).toFixed(0)}k${profile.preferredSalaryMax ? ` – $${(profile.preferredSalaryMax / 1000).toFixed(0)}k` : "+"}`
      : null;

  if (!editing && profile) {
    return (
      <div className="max-w-2xl space-y-6">
        <SectionHeader
          title="Profile"
          subtitle="Your career profile for job compatibility scoring"
          action={
            <div className="flex items-center gap-3">
              {saved && (
                <span className="text-sm text-emerald-600 dark:text-emerald-400 animate-fade-in-up flex items-center gap-1">
                  <CheckCircleIcon className="w-4 h-4" /> Saved
                </span>
              )}
              <Button onClick={() => setEditing(true)} variant="secondary">
                <PencilIcon className="w-4 h-4 mr-1.5" /> Edit Profile
              </Button>
            </div>
          }
        />

        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center ring-1 ring-inset ring-blue-500/20">
              <ProfileIcon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{profile.name || "No name set"}</h2>
              <p className="text-sm text-muted-foreground">
                {profile.yearsOfExperience ? `${profile.yearsOfExperience} years of experience` : "Experience not set"}
                {profile.englishLevel ? ` · ${profile.englishLevel.charAt(0).toUpperCase() + profile.englishLevel.slice(1)} English` : ""}
              </p>
            </div>
          </div>

          <div className="space-y-0">
            <InfoRow label="Preferred Roles" value={profile.preferredRoles.length > 0 ? profile.preferredRoles.join(", ") : null} />
            <InfoRow label="Remote" value={profile.remotePreference ? profile.remotePreference.charAt(0).toUpperCase() + profile.remotePreference.slice(1) : null} />
            <InfoRow label="Salary Range" value={salaryDisplay} />
            <InfoRow label="Company Stage" value={profile.preferredCompanyStage ? profile.preferredCompanyStage.charAt(0).toUpperCase() + profile.preferredCompanyStage.slice(1) : null} />
          </div>
        </Card>

        <Card>
          <CardTitle>Tech Stack</CardTitle>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Primary</p>
              <TagList items={profile.primaryStack} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Secondary</p>
              <TagList items={profile.secondaryStack} />
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>AI Settings</CardTitle>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${profile.openaiApiKey ? "bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/20" : "bg-muted"}`}>
              <KeyIcon className={`w-5 h-5 ${profile.openaiApiKey ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {profile.openaiApiKey ? "API Key configured" : "No API Key"}
              </p>
              <p className="text-xs text-muted-foreground">
                {profile.openaiApiKey
                  ? "AI-powered job analysis and smart import are enabled."
                  : "Add an OpenAI API key to enable AI features."}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <SectionHeader
        title="Edit Profile"
        subtitle="Update your career profile"
        action={
          <Button onClick={handleCancel} variant="secondary">Cancel</Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardTitle>Experience</CardTitle>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Years of Experience</label>
              <input type="number" value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>English Level</label>
              <select value={form.englishLevel} onChange={(e) => setForm({ ...form, englishLevel: e.target.value })} className={inputClass}>
                <option value="">Select...</option>
                <option value="native">Native</option>
                <option value="fluent">Fluent</option>
                <option value="advanced">Advanced</option>
                <option value="intermediate">Intermediate</option>
                <option value="basic">Basic</option>
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Tech Stack</CardTitle>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Primary Stack (comma separated)</label>
              <input value={form.primaryStack} onChange={(e) => setForm({ ...form, primaryStack: e.target.value })} className={inputClass} placeholder="TypeScript, React, Node.js, PostgreSQL" />
            </div>
            <div>
              <label className={labelClass}>Secondary Stack (comma separated)</label>
              <input value={form.secondaryStack} onChange={(e) => setForm({ ...form, secondaryStack: e.target.value })} className={inputClass} placeholder="Python, Go, Docker, AWS" />
            </div>
            <div>
              <label className={labelClass}>Preferred Roles (comma separated)</label>
              <input value={form.preferredRoles} onChange={(e) => setForm({ ...form, preferredRoles: e.target.value })} className={inputClass} placeholder="Senior Frontend, Full Stack, Staff Engineer" />
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Preferences</CardTitle>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Preferred Salary Min</label>
                <input type="number" value={form.preferredSalaryMin} onChange={(e) => setForm({ ...form, preferredSalaryMin: e.target.value })} className={inputClass} placeholder="120000" />
              </div>
              <div>
                <label className={labelClass}>Preferred Salary Max</label>
                <input type="number" value={form.preferredSalaryMax} onChange={(e) => setForm({ ...form, preferredSalaryMax: e.target.value })} className={inputClass} placeholder="180000" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Remote Preference</label>
              <select value={form.remotePreference} onChange={(e) => setForm({ ...form, remotePreference: e.target.value })} className={inputClass}>
                <option value="">Select...</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Preferred Company Stage</label>
              <select value={form.preferredCompanyStage} onChange={(e) => setForm({ ...form, preferredCompanyStage: e.target.value })} className={inputClass}>
                <option value="">Select...</option>
                <option value="startup">Startup</option>
                <option value="scaleup">Scaleup</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>AI Settings</CardTitle>
          <div>
            <label className={labelClass}>OpenAI API Key</label>
            <input type="password" value={form.openaiApiKey} onChange={(e) => setForm({ ...form, openaiApiKey: e.target.value })} className={inputClass} placeholder="sk-..." />
            <p className="text-xs text-muted-foreground mt-1.5">Enable AI-powered job analysis and smart import.</p>
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving} variant="primary" size="lg">
            {saving ? "Saving..." : "Save Profile"}
          </Button>
          <Button onClick={handleCancel} variant="secondary" size="lg">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
