import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, type ClassroomAnalytics } from "@/api/analytics.api";
import { classroomsApi, type Classroom } from "@/api/classrooms.api";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FileText, Percent, TrendingUp, CheckCircle2 } from "lucide-react";

const prefersReduced =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function StatCard({
  label,
  value,
  icon,
  suffix,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary">
          {icon}
        </div>
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <p className="font-mono text-xl font-semibold text-foreground">
        {value}
        {suffix && <span className="text-base text-text-tertiary">{suffix}</span>}
      </p>
    </div>
  );
}

function CriterionHeatmap({
  data,
}: {
  data: ClassroomAnalytics["criterionAverages"];
}) {
  if (!data?.length) return null;
  const assignments = data[0]?.assignments || [];

  return (
    <div className="rounded-xl border border-border bg-surface overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-raised">
            <th className="text-left px-4 py-3 font-medium text-text-secondary sticky left-0 bg-surface-raised">
              Criterion
            </th>
            {assignments.map((a) => (
              <th key={a.assignmentId} className="px-4 py-3 font-medium text-text-secondary text-center min-w-[100px]">
                {a.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.criterion} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium text-foreground sticky left-0 bg-surface">
                {row.criterion}
              </td>
              {row.assignments.map((a) => {
                const pct = a.maxMarks > 0 ? (a.average / a.maxMarks) * 100 : 0;
                const color =
                  pct >= 80
                    ? "bg-success-light text-success"
                    : pct >= 40
                    ? "bg-warning-light text-warning"
                    : "bg-destructive-light text-destructive";
                return (
                  <td key={a.assignmentId} className="px-4 py-3 text-center">
                    <span className={cn("inline-block rounded-full px-2 py-0.5 text-xs font-mono font-medium", color)}>
                      {pct.toFixed(0)}%
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Analytics() {
  const { classroomId } = useParams<{ classroomId: string }>();

  const { data: classroom } = useQuery<Classroom>({
    queryKey: ["classroom", classroomId],
    queryFn: () => classroomsApi.getById(classroomId!),
    enabled: !!classroomId,
  });

  const { data: analytics, isLoading } = useQuery<ClassroomAnalytics>({
    queryKey: ["analytics", classroomId],
    queryFn: () => analyticsApi.classroomAnalytics(classroomId!),
    enabled: !!classroomId,
  });

  if (isLoading) {
    return (
      <MainLayout>
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="font-serif text-xl text-foreground">{classroom?.name || "Analytics"}</h1>
        {classroom?.subject && (
          <p className="text-sm text-text-secondary mt-0.5">{classroom.subject}</p>
        )}
      </div>

      {/* Stat cards */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: prefersReduced ? 0 : 0.05 } } }}
      >
        <motion.div variants={prefersReduced ? {} : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }}>
          <StatCard label="Total Assignments" value={analytics?.totalAssignments || 0} icon={<FileText className="h-4 w-4" />} />
        </motion.div>
        <motion.div variants={prefersReduced ? {} : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }}>
          <StatCard label="Submission Rate" value={analytics?.submissionRate?.toFixed(0) || 0} suffix="%" icon={<Percent className="h-4 w-4" />} />
        </motion.div>
        <motion.div variants={prefersReduced ? {} : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }}>
          <StatCard label="Class Average" value={analytics?.classAverage?.toFixed(0) || 0} suffix="%" icon={<TrendingUp className="h-4 w-4" />} />
        </motion.div>
        <motion.div variants={prefersReduced ? {} : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }}>
          <StatCard label="Graded" value={analytics?.gradedCount || 0} icon={<CheckCircle2 className="h-4 w-4" />} />
        </motion.div>
      </motion.div>

      {/* Score distribution chart */}
      {analytics?.scoreDistribution && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-foreground mb-3">Score Distribution</h2>
          <div className="rounded-xl border border-border bg-surface p-5">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analytics.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="bucket" tick={{ fontSize: 12, fill: "hsl(var(--text-secondary))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--text-secondary))" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--surface))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Criterion Heatmap */}
      {analytics?.criterionAverages && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-foreground mb-3">Criterion Heatmap</h2>
          <CriterionHeatmap data={analytics.criterionAverages} />
        </div>
      )}

      {/* Assignment breakdown */}
      {analytics?.assignments && (
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">Assignment Breakdown</h2>
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-raised">
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Assignment</th>
                  <th className="text-right px-4 py-3 font-medium text-text-secondary">Submissions</th>
                  <th className="px-4 py-3 font-medium text-text-secondary w-32">Sub. Rate</th>
                  <th className="text-right px-4 py-3 font-medium text-text-secondary">Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {analytics.assignments.map((a) => (
                  <tr key={a._id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{a.title}</td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">{a.totalSubmissions}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-surface-raised overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${a.submissionRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-text-secondary w-8 text-right">
                          {a.submissionRate.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {a.averageScore.toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
