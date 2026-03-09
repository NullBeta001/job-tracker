"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { format } from "date-fns";
import { useTheme } from "@/components/ThemeProvider";
import { SectionHeader, Card, CardTitle, MetricCard, PageLoading, EmptyState } from "@/components/ui";
import {
  BriefcaseIcon, CalendarIcon, CheckCircleIcon, XCircleIcon, EyeSlashIcon, ChartBarIcon,
} from "@/components/Icons";

interface Analytics {
  total: number;
  withInterviews: number;
  finalRounds: number;
  offers: number;
  rejected: number;
  ghosted: number;
  conversionRates: { applicationToInterview: string; interviewToFinal: string; finalToOffer: string };
  avgResponseTime: number | null;
  avgSalary: { min: number; max: number } | null;
  funnel: { stage: string; count: number }[];
  timeline: { month: string; count: number }[];
  sources: { source: string; count: number }[];
  upcomingInterviews: {
    id: string;
    interviewDate: string;
    stage: string;
    meetingLink: string | null;
    application: { companyName: string; roleTitle: string };
  }[];
}

const COLORS = ["#3b82f6", "#8b5cf6", "#6366f1", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#6b7280"];

export default function DashboardPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const { resolved } = useTheme();
  const isDark = resolved === "dark";

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoading />;
  if (!data) return <EmptyState title="Failed to load analytics" />;

  const axisColor = isDark ? "#64748b" : "#94a3b8";
  const gridColor = isDark ? "#1e293b" : "#f1f5f9";

  return (
    <div className="space-y-8">
      <SectionHeader title="Dashboard" subtitle="Overview of your job search" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard label="Applications" value={data.total} color="text-blue-600 dark:text-blue-400" icon={<BriefcaseIcon className="w-4 h-4" />} className="stagger-1" />
        <MetricCard label="Interviews" value={data.withInterviews} color="text-purple-600 dark:text-purple-400" icon={<CalendarIcon className="w-4 h-4" />} className="stagger-2" />
        <MetricCard label="Final Rounds" value={data.finalRounds} color="text-amber-600 dark:text-amber-400" icon={<ChartBarIcon className="w-4 h-4" />} className="stagger-3" />
        <MetricCard label="Offers" value={data.offers} color="text-emerald-600 dark:text-emerald-400" icon={<CheckCircleIcon className="w-4 h-4" />} className="stagger-4" />
        <MetricCard label="Rejected" value={data.rejected} color="text-red-500 dark:text-red-400" icon={<XCircleIcon className="w-4 h-4" />} className="stagger-5" />
        <MetricCard label="Ghosted" value={data.ghosted} color="text-muted-foreground" icon={<EyeSlashIcon className="w-4 h-4" />} className="stagger-6" />
      </div>

      <Card>
        <CardTitle>Conversion Rates</CardTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Application \u2192 Interview", value: data.conversionRates.applicationToInterview },
            { label: "Interview \u2192 Final Round", value: data.conversionRates.interviewToFinal },
            { label: "Final Round \u2192 Offer", value: data.conversionRates.finalToOffer },
          ].map((rate) => (
            <div key={rate.label} className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{rate.value}%</p>
              <p className="text-xs text-muted-foreground mt-1">{rate.label}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Application Funnel</CardTitle>
          {data.funnel.some((f) => f.count > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.funnel.filter((f) => f.count > 0)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis type="number" tick={{ fill: axisColor, fontSize: 12 }} />
                <YAxis dataKey="stage" type="category" width={120} tick={{ fill: axisColor, fontSize: 12 }} />
                <Tooltip contentStyle={{ background: isDark ? "#0f172a" : "#fff", border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`, borderRadius: 8, color: isDark ? "#f1f5f9" : "#0f172a" }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No applications yet" />
          )}
        </Card>

        <Card>
          <CardTitle>Application Sources</CardTitle>
          {data.sources.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={data.sources} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={100} label={({ name }) => name} stroke={isDark ? "#0f172a" : "#fff"}>
                  {data.sources.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: isDark ? "#0f172a" : "#fff", border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`, borderRadius: 8, color: isDark ? "#f1f5f9" : "#0f172a" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No source data" />
          )}
        </Card>

        <Card>
          <CardTitle>Application Timeline</CardTitle>
          {data.timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 12 }} />
                <YAxis tick={{ fill: axisColor, fontSize: 12 }} />
                <Tooltip contentStyle={{ background: isDark ? "#0f172a" : "#fff", border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`, borderRadius: 8, color: isDark ? "#f1f5f9" : "#0f172a" }} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No timeline data" />
          )}
        </Card>

        <Card>
          <CardTitle>Insights</CardTitle>
          <div className="space-y-1">
            {[
              { label: "Avg Response Time", value: data.avgResponseTime !== null ? `${data.avgResponseTime} days` : "N/A" },
              { label: "Avg Salary Range", value: data.avgSalary ? `$${(data.avgSalary.min / 1000).toFixed(0)}k - $${(data.avgSalary.max / 1000).toFixed(0)}k` : "N/A" },
              { label: "Success Rate", value: `${data.total ? ((data.offers / data.total) * 100).toFixed(1) : "0"}%` },
              { label: "Ghost Rate", value: `${data.total ? ((data.ghosted / data.total) * 100).toFixed(1) : "0"}%` },
            ].map((item, i) => (
              <div key={item.label} className={`flex justify-between items-center py-3 ${i < 3 ? "border-b border-border" : ""}`}>
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Upcoming Interviews</CardTitle>
        {data.upcomingInterviews.length > 0 ? (
          <div className="space-y-2">
            {data.upcomingInterviews.map((interview) => (
              <div key={interview.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm text-foreground">{interview.application.companyName}</p>
                  <p className="text-xs text-muted-foreground">
                    {interview.application.roleTitle} &mdash; {interview.stage}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm font-medium text-foreground">
                    {format(new Date(interview.interviewDate), "MMM d, yyyy")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(interview.interviewDate), "h:mm a")}
                  </p>
                  {interview.meetingLink && (
                    <a
                      href={interview.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Join Meeting
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No upcoming interviews" />
        )}
      </Card>
    </div>
  );
}
