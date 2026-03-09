"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import StatusBadge from "@/components/StatusBadge";
import FitScoreBadge from "@/components/FitScoreBadge";
import { Card, CardTitle, Button, Tabs, EmptyState, PageLoading } from "@/components/ui";
import { ArrowLeftIcon, TrashIcon, SparklesIcon, PlusIcon, LinkIcon } from "@/components/Icons";

interface Note {
  id: string;
  type: string;
  content: string;
  createdAt: string;
}

interface Interview {
  id: string;
  interviewDate: string;
  stage: string;
  meetingLink: string | null;
  notes: string | null;
}

interface ApplicationDetail {
  id: string;
  companyName: string;
  roleTitle: string;
  salaryMin: number | null;
  salaryMax: number | null;
  location: string | null;
  remoteType: string | null;
  jobDescription: string | null;
  techStack: string[];
  source: string | null;
  jobUrl: string | null;
  dateApplied: string;
  status: string;
  fitScore: number | null;
  lastContactDate: string | null;
  notes: Note[];
  interviews: Interview[];
}

const STATUSES = [
  "Applied", "Recruiter Screen", "Technical Interview",
  "System Design", "Final Interview", "Offer", "Rejected", "Ghosted",
];

const NOTE_TYPES = ["note", "feedback", "follow-up"];

const inputClass = "w-full bg-input-bg border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("note");
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    interviewDate: "",
    stage: "Recruiter Screen",
    meetingLink: "",
    notes: "",
  });
  const [aiAnalysis, setAiAnalysis] = useState<{
    techStack?: string[];
    seniorityLevel?: string;
    fitSummary?: string;
    interviewTips?: string[];
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const fetchApp = () => {
    fetch(`/api/applications/${id}`)
      .then((r) => r.json())
      .then(setApp)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchApp(); }, [id]);

  async function updateStatus(status: string) {
    await fetch(`/api/applications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchApp();
  }

  async function addNote() {
    if (!newNote.trim()) return;
    await fetch(`/api/applications/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newNote, type: noteType }),
    });
    setNewNote("");
    fetchApp();
  }

  async function deleteNote(noteId: string) {
    await fetch(`/api/applications/${id}/notes?noteId=${noteId}`, { method: "DELETE" });
    fetchApp();
  }

  async function addInterview(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/applications/${id}/interviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(interviewForm),
    });
    setInterviewForm({ interviewDate: "", stage: "Recruiter Screen", meetingLink: "", notes: "" });
    setShowInterviewForm(false);
    fetchApp();
  }

  async function deleteInterview(interviewId: string) {
    await fetch(`/api/applications/${id}/interviews?interviewId=${interviewId}`, { method: "DELETE" });
    fetchApp();
  }

  async function deleteApplication() {
    if (!confirm("Delete this application?")) return;
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
    router.push("/applications");
  }

  async function runAiAnalysis() {
    if (!app?.jobDescription) return;
    setAiLoading(true);
    setAiError("");

    const profileRes = await fetch("/api/profile");
    const profile = await profileRes.json();

    const profileSummary = `${profile.yearsOfExperience || 0} years experience. Primary stack: ${(profile.primaryStack || []).join(", ")}. Secondary: ${(profile.secondaryStack || []).join(", ")}. Preferred roles: ${(profile.preferredRoles || []).join(", ")}.`;

    const res = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobDescription: app.jobDescription, profileSummary }),
    });

    if (!res.ok) {
      const data = await res.json();
      setAiError(data.error || "AI analysis failed");
      setAiLoading(false);
      return;
    }

    const analysis = await res.json();
    setAiAnalysis(analysis);
    setAiLoading(false);
  }

  if (loading) return <PageLoading />;
  if (!app) return <EmptyState title="Application not found" />;

  const tabList = [
    { id: "overview", label: "Overview" },
    { id: "notes", label: `Notes (${app.notes.length})` },
    { id: "interviews", label: `Interviews (${app.interviews.length})` },
    { id: "ai", label: "AI Insights" },
  ];

  const noteTypeStyles: Record<string, string> = {
    feedback: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20",
    "follow-up": "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-inset ring-amber-500/20",
    note: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <button
        onClick={() => router.back()}
        className="cursor-pointer flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back
      </button>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">{app.companyName}</h1>
            <p className="text-base text-muted-foreground mt-1">{app.roleTitle}</p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <StatusBadge status={app.status} />
              <FitScoreBadge score={app.fitScore} />
              {app.location && <span className="text-sm text-muted-foreground">{app.location}</span>}
              {app.remoteType && (
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md">{app.remoteType}</span>
              )}
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={deleteApplication}>
            <TrashIcon className="w-4 h-4 mr-1" /> Delete
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
          <div>
            <p className="text-muted-foreground">Applied</p>
            <p className="font-medium text-foreground">{format(new Date(app.dateApplied), "MMM d, yyyy")}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Salary</p>
            <p className="font-medium text-foreground">
              {app.salaryMin
                ? `$${(app.salaryMin / 1000).toFixed(0)}k${app.salaryMax ? ` - $${(app.salaryMax / 1000).toFixed(0)}k` : ""}`
                : "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Source</p>
            <p className="font-medium text-foreground">{app.source || "\u2014"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">URL</p>
            {app.jobUrl ? (
              <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1">
                <LinkIcon className="w-3 h-3" /> View Job
              </a>
            ) : (
              <p className="font-medium text-foreground">{"\u2014"}</p>
            )}
          </div>
        </div>

        {app.techStack.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Tech Stack</p>
            <div className="flex flex-wrap gap-1.5">
              {app.techStack.map((tech) => (
                <span key={tech} className="bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ring-blue-500/20">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card padding="p-0">
        <div className="px-6 pt-4">
          <CardTitle>Update Status</CardTitle>
          <div className="flex flex-wrap gap-2 pb-4">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  app.status === s
                    ? "bg-blue-600 text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card padding="p-0">
        <div className="px-6 pt-4">
          <Tabs tabs={tabList} active={activeTab} onChange={setActiveTab} />
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div>
              {app.jobDescription ? (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Job Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{app.jobDescription}</p>
                </div>
              ) : (
                <EmptyState title="No job description added" />
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value)}
                  className={inputClass + " sm:w-auto"}
                >
                  {NOTE_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
                <input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className={inputClass + " flex-1"}
                  onKeyDown={(e) => e.key === "Enter" && addNote()}
                />
                <Button onClick={addNote} variant="primary" size="md">Add</Button>
              </div>

              {app.notes.length > 0 ? (
                <div className="space-y-2">
                  {app.notes.map((note) => (
                    <div key={note.id} className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 p-3 bg-muted rounded-lg">
                      <div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${noteTypeStyles[note.type] || noteTypeStyles.note}`}>
                          {note.type}
                        </span>
                        <p className="text-sm text-foreground mt-1.5">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <button onClick={() => deleteNote(note.id)} className="cursor-pointer text-xs text-red-500 hover:text-red-400 self-start">
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No notes yet" />
              )}
            </div>
          )}

          {activeTab === "interviews" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => setShowInterviewForm(!showInterviewForm)} variant={showInterviewForm ? "secondary" : "primary"} size="sm">
                  {showInterviewForm ? "Cancel" : <><PlusIcon className="w-4 h-4 mr-1" /> Schedule Interview</>}
                </Button>
              </div>

              {showInterviewForm && (
                <form onSubmit={addInterview} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-muted rounded-lg animate-fade-in-up">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Date & Time</label>
                    <input type="datetime-local" required value={interviewForm.interviewDate} onChange={(e) => setInterviewForm({ ...interviewForm, interviewDate: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Stage</label>
                    <select value={interviewForm.stage} onChange={(e) => setInterviewForm({ ...interviewForm, stage: e.target.value })} className={inputClass}>
                      {STATUSES.slice(1, 5).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Meeting Link</label>
                    <input type="url" value={interviewForm.meetingLink} onChange={(e) => setInterviewForm({ ...interviewForm, meetingLink: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Notes</label>
                    <input value={interviewForm.notes} onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })} className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" variant="primary" size="md">Schedule</Button>
                  </div>
                </form>
              )}

              {app.interviews.length > 0 ? (
                <div className="space-y-2">
                  {app.interviews.map((interview) => (
                    <div key={interview.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">{interview.stage}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(interview.interviewDate), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                        {interview.notes && <p className="text-xs text-muted-foreground mt-1">{interview.notes}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        {interview.meetingLink && (
                          <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                            Join
                          </a>
                        )}
                        <button onClick={() => deleteInterview(interview.id)} className="cursor-pointer text-xs text-red-500 hover:text-red-400">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No interviews scheduled" />
              )}
            </div>
          )}

          {activeTab === "ai" && (
            <div className="space-y-4">
              {app.jobDescription ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">Analyze this job description with AI to get insights.</p>
                    <Button onClick={runAiAnalysis} disabled={aiLoading} variant="primary" size="sm">
                      <SparklesIcon className="w-4 h-4 mr-1.5" />
                      {aiLoading ? "Analyzing..." : "Run Analysis"}
                    </Button>
                  </div>

                  {aiError && <p className="text-sm text-red-500 dark:text-red-400">{aiError}</p>}

                  {aiAnalysis && (
                    <div className="p-4 bg-purple-500/5 rounded-lg border border-purple-500/20 space-y-3 animate-fade-in-up">
                      <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4" /> AI Analysis
                      </h3>
                      {aiAnalysis.seniorityLevel && (
                        <p className="text-sm text-foreground"><strong>Seniority:</strong> {aiAnalysis.seniorityLevel}</p>
                      )}
                      {aiAnalysis.fitSummary && (
                        <p className="text-sm text-foreground"><strong>Fit Summary:</strong> {aiAnalysis.fitSummary}</p>
                      )}
                      {aiAnalysis.techStack && aiAnalysis.techStack.length > 0 && (
                        <div>
                          <strong className="text-sm text-foreground">Extracted Stack:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {aiAnalysis.techStack.map((t) => (
                              <span key={t} className="bg-purple-500/10 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-md text-xs ring-1 ring-inset ring-purple-500/20">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {aiAnalysis.interviewTips && aiAnalysis.interviewTips.length > 0 && (
                        <div>
                          <strong className="text-sm text-foreground">Interview Tips:</strong>
                          <ul className="list-disc list-inside text-sm mt-1 space-y-1 text-muted-foreground">
                            {aiAnalysis.interviewTips.map((tip, i) => <li key={i}>{tip}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <EmptyState title="No job description available" description="Add a job description to enable AI analysis." />
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
