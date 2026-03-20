import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { classroomsApi, type Classroom, type ClassroomStudent } from "@/api/classrooms.api";
import { assignmentsApi, type Assignment } from "@/api/assignments.api";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { StatusBadge, ScoreBadge } from "@/components/ui/Badge";
import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { AssignmentSlideOver } from "@/components/assignments/AssignmentSlideOver";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/helpers";
import { Copy, Plus, Check, FileText, Calendar } from "lucide-react";
import toast from "react-hot-toast";

export default function ClassroomDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTeacher = user?.role === "teacher";
  const [tab, setTab] = useState<"assignments" | "students">("assignments");
  const [slideOpen, setSlideOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: classroom, isLoading: loadingClassroom } = useQuery<Classroom>({
    queryKey: ["classroom", id],
    queryFn: () => classroomsApi.getById(id!),
    enabled: !!id,
  });

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery<Assignment[]>({
    queryKey: ["assignments", id],
    queryFn: () => assignmentsApi.listByClassroom(id!),
    enabled: !!id,
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery<ClassroomStudent[]>({
    queryKey: ["classroom-students", id],
    queryFn: () => classroomsApi.getStudents(id!),
    enabled: !!id && isTeacher,
  });

  const copyCode = () => {
    if (classroom?.joinCode) {
      navigator.clipboard.writeText(classroom.joinCode);
      setCopied(true);
      toast.success("Join code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loadingClassroom) {
    return (
      <MainLayout>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-32 mb-8" />
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-xl text-foreground">{classroom?.name}</h1>
            <p className="text-sm text-text-secondary mt-0.5">{classroom?.subject}</p>
          </div>
          {isTeacher && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2">
                <span className="text-xs text-text-secondary">Code:</span>
                <span className="font-mono text-sm text-foreground">{classroom?.joinCode}</span>
                <button onClick={copyCode} className="text-text-secondary hover:text-foreground transition-colors" aria-label="Copy join code">
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <Button onClick={() => setSlideOpen(true)}>
                <Plus className="h-4 w-4" /> New Assignment
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-surface-raised p-1 mb-6 w-fit">
        {(["assignments", ...(isTeacher ? ["students"] : [])] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t ? "bg-surface text-foreground shadow-sm" : "text-text-secondary hover:text-foreground"
            )}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Assignments tab */}
      {tab === "assignments" && (
        <>
          {loadingAssignments ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : !assignments.length ? (
            <EmptyState
              title="No assignments yet"
              subtitle={isTeacher ? "Create your first assignment." : "Your teacher hasn't posted any assignments yet."}
              action={isTeacher ? { label: "New Assignment", onClick: () => setSlideOpen(true) } : undefined}
            />
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => (
                <div
                  key={a._id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/assignments/${a._id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{a.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Due {formatDate(a.dueDate)}
                        </span>
                        {isTeacher && <span>{a.submissionCount ?? 0} submissions</span>}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Students tab */}
      {tab === "students" && isTeacher && (
        <>
          {loadingStudents ? (
            <SkeletonTable rows={5} />
          ) : !students.length ? (
            <EmptyState title="No students yet" subtitle="Share the join code with your students." />
          ) : (
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-raised">
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Email</th>
                    <th className="text-right px-4 py-3 font-medium text-text-secondary">Submissions</th>
                    <th className="text-right px-4 py-3 font-medium text-text-secondary">Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s._id} className="border-b border-border last:border-0 hover:bg-surface-raised/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                      <td className="px-4 py-3 text-text-secondary">{s.email}</td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">{s.submissionsCount}</td>
                      <td className="px-4 py-3 text-right">
                        {s.averageScore > 0 ? (
                          <span className="font-mono text-foreground">{s.averageScore.toFixed(0)}%</span>
                        ) : (
                          <span className="text-text-tertiary">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Slide-over for new assignment */}
      {isTeacher && (
        <AssignmentSlideOver
          open={slideOpen}
          onClose={() => setSlideOpen(false)}
          classroomId={id!}
        />
      )}
    </MainLayout>
  );
}
