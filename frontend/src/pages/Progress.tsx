import { useQuery } from "@tanstack/react-query";
import { analyticsApi, type StudentProgress as ProgressData } from "@/api/analytics.api";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatusBadge, ScoreBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/utils/helpers";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Progress() {
  const navigate = useNavigate();

  const { data: progress, isLoading } = useQuery<ProgressData>({
    queryKey: ["my-progress"],
    queryFn: analyticsApi.myProgress,
  });

  if (isLoading) {
    return (
      <MainLayout>
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-64 w-full rounded-xl mb-8" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </MainLayout>
    );
  }

  if (!progress?.submissions?.length) {
    return (
      <MainLayout>
        <h1 className="font-serif text-xl text-foreground mb-8">My Progress</h1>
        <EmptyState
          title="No graded submissions yet"
          subtitle="Submit your first assignment to start tracking progress."
        />
      </MainLayout>
    );
  }

  const avgColor =
    (progress.overallAverage || 0) >= 80
      ? "bg-success-light text-success"
      : (progress.overallAverage || 0) >= 40
      ? "bg-warning-light text-warning"
      : "bg-destructive-light text-destructive";

  return (
    <MainLayout>
      <div className="flex items-center gap-4 mb-8">
        <h1 className="font-serif text-xl text-foreground">My Progress</h1>
        <span className={`rounded-full px-3 py-1 text-sm font-mono font-medium ${avgColor}`}>
          {progress.overallAverage?.toFixed(0)}% avg
        </span>
      </div>

      {/* Score history line chart */}
      {progress.scoreHistory?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-foreground mb-3">Score History</h2>
          <div className="rounded-xl border border-border bg-surface p-5">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={progress.scoreHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="assignment"
                  tick={{ fontSize: 12, fill: "hsl(var(--text-secondary))" }}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--text-secondary))" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--surface))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Criterion strengths */}
      {progress.criterionStrengths?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-foreground mb-3">Criterion Strengths</h2>
          <div className="rounded-xl border border-border bg-surface p-5">
            <ResponsiveContainer width="100%" height={Math.max(200, progress.criterionStrengths.length * 40)}>
              <BarChart data={progress.criterionStrengths} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--text-secondary))" }} />
                <YAxis
                  type="category"
                  dataKey="criterion"
                  width={120}
                  tick={{ fontSize: 12, fill: "hsl(var(--text-secondary))" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--surface))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="averagePercentage" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Submission history table */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Submission History</h2>
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-raised">
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Assignment</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Classroom</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Submitted</th>
                <th className="text-right px-4 py-3 font-medium text-text-secondary">Score</th>
                <th className="text-right px-4 py-3 font-medium text-text-secondary">Status</th>
                <th className="text-right px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {progress.submissions.map((s) => (
                <tr key={s._id} className="border-b border-border last:border-0 hover:bg-surface-raised/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{s.assignmentTitle}</td>
                  <td className="px-4 py-3 text-text-secondary">{s.classroom}</td>
                  <td className="px-4 py-3 text-text-secondary">{formatDate(s.submittedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {s.score > 0 ? (
                      <ScoreBadge score={s.score} maxScore={s.maxScore} />
                    ) : (
                      <span className="text-text-tertiary">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <StatusBadge status={s.status as any} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => navigate(`/submissions/${s._id}`)}
                      className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
