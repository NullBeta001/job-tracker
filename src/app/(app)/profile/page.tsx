"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { SectionHeader, Card, CardTitle, Button, PageLoading } from "@/components/ui";
import { PencilIcon, CheckCircleIcon, KeyIcon, LinkIcon } from "@/components/Icons";

interface ProfileData {
  name: string;
  bio: string | null;
  currentRole: string | null;
  currentCompany: string | null;
  location: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  yearsOfExperience: number | null;
  primaryStack: string[];
  secondaryStack: string[];
  preferredRoles: string[];
  certifications: string[];
  education: string[];
  englishLevel: string | null;
  preferredSalaryMin: number | null;
  preferredSalaryMax: number | null;
  remotePreference: string | null;
  preferredCompanyStage: string | null;
  openaiApiKey: string | null;
  userImage: string | null;
}

const inputClass = "w-full bg-input-bg border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const labelClass = "block text-sm font-medium text-foreground mb-1.5";

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 py-2.5 border-b border-border last:border-0">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide sm:w-44 shrink-0">{label}</span>
      <span className="text-sm text-foreground">{value || <span className="text-muted-foreground italic">Not set</span>}</span>
    </div>
  );
}

function TagList({ items, color = "blue" }: { items: string[]; color?: "blue" | "purple" | "amber" }) {
  if (items.length === 0) return <span className="text-sm text-muted-foreground italic">Not set</span>;
  const colors = {
    blue: "bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-blue-500/20",
    purple: "bg-purple-500/10 text-purple-700 dark:text-purple-400 ring-purple-500/20",
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20",
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className={`${colors[color]} px-2.5 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function LinkedInImportModal({ onClose, onImport }: { onClose: () => void; onImport: (data: Partial<ProfileData>) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<Partial<ProfileData> | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  async function handleFileSelect(file: File) {
    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large. Maximum 5MB.");
      return;
    }

    setUploading(true);
    setError("");
    setPreview(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/profile/import-linkedin", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Import failed");
        setUploading(false);
        return;
      }

      const parsed = await res.json();
      setPreview(parsed);
    } catch {
      setError("Network error. Please try again.");
    }
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Import from LinkedIn</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Upload your LinkedIn profile PDF</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!preview ? (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                {uploading ? (
                  <p className="text-sm text-muted-foreground">Reading PDF...</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">Drop your LinkedIn PDF here</p>
                    <p className="text-xs text-muted-foreground mt-1">or click to browse (PDF only, max 5MB)</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
              </div>

              {error && (
                <div className="mt-4 bg-red-500/10 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg ring-1 ring-inset ring-red-500/20">
                  {error}
                </div>
              )}

              <div className="mt-4">
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  {showInstructions ? "Hide" : "How to export your LinkedIn PDF?"}
                  <svg className={`w-3.5 h-3.5 transition-transform ${showInstructions ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {showInstructions && (
                  <div className="mt-3 bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                    <p className="font-medium text-foreground">Steps to export:</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
                      <li>Go to your <a href="https://linkedin.com/in/me" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">LinkedIn profile</a></li>
                      <li>Click the <strong className="text-foreground">More</strong> button (next to &quot;Open to&quot;)</li>
                      <li>Select <strong className="text-foreground">Save to PDF</strong></li>
                      <li>A PDF will download — upload it here</li>
                    </ol>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2 mb-3">
                  <CheckCircleIcon className="w-4 h-4" /> Profile data extracted
                </p>
                <div className="space-y-2 text-sm">
                  {preview.name && <InfoRow label="Name" value={preview.name} />}
                  {preview.currentRole && <InfoRow label="Current Role" value={preview.currentRole} />}
                  {preview.currentCompany && <InfoRow label="Company" value={preview.currentCompany} />}
                  {preview.location && <InfoRow label="Location" value={preview.location} />}
                  {preview.yearsOfExperience && <InfoRow label="Experience" value={`${preview.yearsOfExperience} years`} />}
                  {preview.primaryStack && preview.primaryStack.length > 0 && (
                    <div className="py-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Skills</p>
                      <TagList items={preview.primaryStack} />
                    </div>
                  )}
                  {preview.certifications && preview.certifications.length > 0 && (
                    <div className="py-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Certifications</p>
                      <TagList items={preview.certifications} color="purple" />
                    </div>
                  )}
                  {preview.education && preview.education.length > 0 && (
                    <div className="py-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Education</p>
                      {preview.education.map((e, i) => (
                        <p key={i} className="text-sm text-foreground">{e}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => { onImport(preview); onClose(); }} variant="primary" size="lg" className="flex-1">
                  Apply to Profile
                </Button>
                <Button onClick={() => setPreview(null)} variant="secondary" size="lg">
                  Try Another
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showLinkedInImport, setShowLinkedInImport] = useState(false);

  const [form, setForm] = useState({
    name: "",
    bio: "",
    currentRole: "",
    currentCompany: "",
    location: "",
    phone: "",
    linkedinUrl: "",
    portfolioUrl: "",
    yearsOfExperience: "",
    primaryStack: "",
    secondaryStack: "",
    preferredRoles: "",
    certifications: "",
    education: "",
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
      bio: data.bio || "",
      currentRole: data.currentRole || "",
      currentCompany: data.currentCompany || "",
      location: data.location || "",
      phone: data.phone || "",
      linkedinUrl: data.linkedinUrl || "",
      portfolioUrl: data.portfolioUrl || "",
      yearsOfExperience: data.yearsOfExperience?.toString() || "",
      primaryStack: (data.primaryStack || []).join(", "),
      secondaryStack: (data.secondaryStack || []).join(", "),
      preferredRoles: (data.preferredRoles || []).join(", "),
      certifications: (data.certifications || []).join(", "),
      education: (data.education || []).join("\n"),
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
      bio: form.bio || null,
      currentRole: form.currentRole || null,
      currentCompany: form.currentCompany || null,
      location: form.location || null,
      phone: form.phone || null,
      linkedinUrl: form.linkedinUrl || null,
      portfolioUrl: form.portfolioUrl || null,
      yearsOfExperience: form.yearsOfExperience ? parseInt(form.yearsOfExperience) : null,
      primaryStack: form.primaryStack ? form.primaryStack.split(",").map((s) => s.trim()).filter(Boolean) : [],
      secondaryStack: form.secondaryStack ? form.secondaryStack.split(",").map((s) => s.trim()).filter(Boolean) : [],
      preferredRoles: form.preferredRoles ? form.preferredRoles.split(",").map((s) => s.trim()).filter(Boolean) : [],
      certifications: form.certifications ? form.certifications.split(",").map((s) => s.trim()).filter(Boolean) : [],
      education: form.education ? form.education.split("\n").map((s) => s.trim()).filter(Boolean) : [],
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
    setProfile({ ...updated, openaiApiKey: form.openaiApiKey || null, userImage: profile?.userImage || null });
    loadFormFromProfile({ ...updated, openaiApiKey: form.openaiApiKey || null, userImage: profile?.userImage || null });
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleCancel() {
    if (profile) loadFormFromProfile(profile);
    setEditing(false);
  }

  function handleLinkedInImport(data: Partial<ProfileData>) {
    setForm((f) => ({
      ...f,
      name: data.name || f.name,
      bio: data.bio || f.bio,
      currentRole: data.currentRole || f.currentRole,
      currentCompany: data.currentCompany || f.currentCompany,
      location: data.location || f.location,
      phone: data.phone || f.phone,
      linkedinUrl: data.linkedinUrl || f.linkedinUrl,
      portfolioUrl: data.portfolioUrl || f.portfolioUrl,
      yearsOfExperience: data.yearsOfExperience?.toString() || f.yearsOfExperience,
      primaryStack: data.primaryStack?.length ? data.primaryStack.join(", ") : f.primaryStack,
      certifications: data.certifications?.length ? data.certifications.join(", ") : f.certifications,
      education: data.education?.length ? data.education.join("\n") : f.education,
    }));
    setEditing(true);
  }

  if (loading) return <PageLoading />;

  const avatarUrl = profile?.userImage || session?.user?.image;
  const salaryDisplay = profile?.preferredSalaryMin
    ? `$${(profile.preferredSalaryMin / 1000).toFixed(0)}k${profile.preferredSalaryMax ? ` – $${(profile.preferredSalaryMax / 1000).toFixed(0)}k` : "+"}`
    : null;

  if (!editing && profile) {
    return (
      <div className="max-w-2xl space-y-6">
        <SectionHeader
          title="Profile"
          subtitle="Your career profile for job compatibility scoring"
          action={
            <div className="flex items-center gap-2 flex-wrap">
              {saved && (
                <span className="text-sm text-emerald-600 dark:text-emerald-400 animate-fade-in-up flex items-center gap-1">
                  <CheckCircleIcon className="w-4 h-4" /> Saved
                </span>
              )}
              <Button onClick={() => setShowLinkedInImport(true)} variant="secondary">
                <LinkIcon className="w-4 h-4 mr-1.5" /> Import LinkedIn
              </Button>
              <Button onClick={() => setEditing(true)} variant="secondary">
                <PencilIcon className="w-4 h-4 mr-1.5" /> Edit
              </Button>
            </div>
          }
        />

        <Card>
          <div className="flex items-center gap-4 mb-6">
            {avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatarUrl}
                alt={profile.name || "Profile"}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-border"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center ring-2 ring-border text-2xl font-bold text-blue-600 dark:text-blue-400">
                {(profile.name || "?")[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">{profile.name || "No name set"}</h2>
              {profile.currentRole && (
                <p className="text-sm text-foreground truncate">
                  {profile.currentRole}
                  {profile.currentCompany && <span className="text-muted-foreground"> at {profile.currentCompany}</span>}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {[
                  profile.location,
                  profile.yearsOfExperience ? `${profile.yearsOfExperience} years exp` : null,
                  profile.englishLevel ? `${profile.englishLevel.charAt(0).toUpperCase() + profile.englishLevel.slice(1)} English` : null,
                ].filter(Boolean).join(" · ") || "Complete your profile for better matching"}
              </p>
            </div>
          </div>

          {profile.bio && (
            <div className="mb-6 pb-6 border-b border-border">
              <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
            </div>
          )}

          <div className="space-y-0">
            <InfoRow label="Preferred Roles" value={profile.preferredRoles.length > 0 ? profile.preferredRoles.join(", ") : null} />
            <InfoRow label="Remote" value={profile.remotePreference ? profile.remotePreference.charAt(0).toUpperCase() + profile.remotePreference.slice(1) : null} />
            <InfoRow label="Salary Range" value={salaryDisplay} />
            <InfoRow label="Company Stage" value={profile.preferredCompanyStage ? profile.preferredCompanyStage.charAt(0).toUpperCase() + profile.preferredCompanyStage.slice(1) : null} />
            {profile.phone && <InfoRow label="Phone" value={profile.phone} />}
            {profile.linkedinUrl && (
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 py-2.5 border-b border-border">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide sm:w-44 shrink-0">LinkedIn</span>
                <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate">{profile.linkedinUrl}</a>
              </div>
            )}
            {profile.portfolioUrl && (
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 py-2.5 border-b border-border last:border-0">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide sm:w-44 shrink-0">Portfolio</span>
                <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate">{profile.portfolioUrl}</a>
              </div>
            )}
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

        {(profile.certifications.length > 0 || profile.education.length > 0) && (
          <Card>
            <CardTitle>Certifications & Education</CardTitle>
            <div className="space-y-4">
              {profile.certifications.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Certifications</p>
                  <TagList items={profile.certifications} color="purple" />
                </div>
              )}
              {profile.education.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Education</p>
                  <div className="space-y-1.5">
                    {profile.education.map((e, i) => (
                      <p key={i} className="text-sm text-foreground">{e}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

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

        {showLinkedInImport && (
          <LinkedInImportModal
            onClose={() => setShowLinkedInImport(false)}
            onImport={handleLinkedInImport}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <SectionHeader
        title="Edit Profile"
        subtitle="Update your career profile"
        action={
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowLinkedInImport(true)} variant="secondary">
              <LinkIcon className="w-4 h-4 mr-1.5" /> Import LinkedIn
            </Button>
            <Button onClick={handleCancel} variant="secondary">Cancel</Button>
          </div>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardTitle>About You</CardTitle>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Years of Experience</label>
                <input type="number" value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Current Role</label>
                <input value={form.currentRole} onChange={(e) => setForm({ ...form, currentRole: e.target.value })} className={inputClass} placeholder="Senior Frontend Engineer" />
              </div>
              <div>
                <label className={labelClass}>Current Company</label>
                <input value={form.currentCompany} onChange={(e) => setForm({ ...form, currentCompany: e.target.value })} className={inputClass} placeholder="Acme Inc" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Location</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} placeholder="San Francisco, CA" />
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
            <div>
              <label className={labelClass}>Bio / Summary</label>
              <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className={inputClass + " h-24 resize-none"} placeholder="Brief professional summary..." />
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Tech Stack</CardTitle>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Primary Stack (comma separated)</label>
              <input value={form.primaryStack} onChange={(e) => setForm({ ...form, primaryStack: e.target.value })} className={inputClass} placeholder="TypeScript, React, Node.js" />
            </div>
            <div>
              <label className={labelClass}>Secondary Stack (comma separated)</label>
              <input value={form.secondaryStack} onChange={(e) => setForm({ ...form, secondaryStack: e.target.value })} className={inputClass} placeholder="Python, Go, Docker, AWS" />
            </div>
            <div>
              <label className={labelClass}>Preferred Roles (comma separated)</label>
              <input value={form.preferredRoles} onChange={(e) => setForm({ ...form, preferredRoles: e.target.value })} className={inputClass} placeholder="Senior Frontend, Full Stack" />
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Certifications & Education</CardTitle>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Certifications (comma separated)</label>
              <input value={form.certifications} onChange={(e) => setForm({ ...form, certifications: e.target.value })} className={inputClass} placeholder="AWS Solutions Architect, Google Cloud" />
            </div>
            <div>
              <label className={labelClass}>Education (one per line)</label>
              <textarea value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} className={inputClass + " h-24 resize-none"} placeholder={"BSc Computer Science — MIT\nMSc AI — Stanford"} />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>
        </Card>

        <Card>
          <CardTitle>Links & Contact</CardTitle>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+1 (555) 123-4567" />
              </div>
              <div>
                <label className={labelClass}>LinkedIn URL</label>
                <input type="url" value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} className={inputClass} placeholder="https://linkedin.com/in/..." />
              </div>
            </div>
            <div>
              <label className={labelClass}>Portfolio URL</label>
              <input type="url" value={form.portfolioUrl} onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })} className={inputClass} placeholder="https://yoursite.com" />
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
          <Button type="button" onClick={handleCancel} variant="secondary" size="lg">
            Cancel
          </Button>
        </div>
      </form>

      {showLinkedInImport && (
        <LinkedInImportModal
          onClose={() => setShowLinkedInImport(false)}
          onImport={handleLinkedInImport}
        />
      )}
    </div>
  );
}
