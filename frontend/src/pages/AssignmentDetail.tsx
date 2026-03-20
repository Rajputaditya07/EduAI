import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assignmentsApi, type Assignment } from "@/api/assignments.api";
import { submissionsApi, type Submission } from "@/api/submissions.api";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { StatusBadge, ScoreBadge } from "@/components/ui/Badge";
import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileUploadZone } from "@/components/ui/FileUploadZone";
import { AssignmentSlideOver } from "@/components/assignments/AssignmentSlideOver";
import { formatDate } from "@/utils/helpers";
import { Calendar, Pencil, Send } from "lucide-react";
import toast from "react-hot-toast";

export default function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isTeacher = user?.role === "teacher";
  const [editOpen, setEditOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>();

  const { data: assignment, isLoading } = useQuery<Assignment>({
    queryKey: ["assignment", id],
    queryFn: () => assignmentsApi.getById(id!),
    enabled: !!id,
  });

  // Teacher: list all submissions
  const { data: submissions = [] } = useQuery<Submission[]>({
    queryKey: ["submissions", id],
    queryFn: () => submissionsApi.listByAssignment(id!),
    enabled: !!id && isTeacher,
  });

  // Student: get own submission
  const { data: mySubmission } = useQuery<Submission>({
    queryKey: ["my-submission", id],
    queryFn: () => submissionsApi.getMySubmission(id!),
    enabled: !!id && !isTeacher,
    retry: false,
  });

  const publishMutation = useMutation({
    mutationFn: () => assignmentsApi.publish(id!),
    onSuccess: () => {
      toast.success("Assignment published");
      qc.invalidateQueries({ queryKey: ["assignment", id] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => submissionsApi.submit(file!, id!),
    onSuccess: () => {
      toast.success("Submission uploaded");
      qc.invalidateQueries({ queryKey: ["my-submission", id] });
      setFile(null);
      setUploadProgress(undefined);
    },
  });

  if (isLoading) {
    return (
      <MainLayout>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-48 mb-8" />
        <Skeleton className="h-40 w-full" />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-xl text-foreground">{assignment?.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge status={assignment?.status || "draft"} />
            <span className="flex items-center gap-1 text-sm text-text-secondary">
              <Calendar className="h-3.5 w-3.5" /> Due {formatDate(assignment?.dueDate || "")}
            </span>
          </div>
        </div>
        {isTeacher && (
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} aria-label="Edit assignment">
              <Pencil className="h-4 w-4" />
            </Button>
            {assignment?.status === "draft" && (
              <Button onClick={() => publishMutation.mutate()} loading={publishMutation.isPending}>
                Publish
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {assignment?.description && (
        <p className="text-sm text-text-secondary mb-8 max-w-2xl">{assignment.description}</p>
      )}

      {/* Rubric */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-foreground mb-3">Rubric</h2>
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-raised">
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Criterion</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Description</th>
                <th className="text-right px-4 py-3 font-medium text-text-secondary">Max Marks</th>
              </tr>
            </thead>
            <tbody>
              {assignment?.rubric.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{r.criterion}</td>
                  <td className="px-4 py-3 text-text-secondary">{r.description}</td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">{r.maxMarks}</td>
                </tr>
              ))}
              <tr className="bg-surface-raised">
                <td colSpan={2} className="px-4 py-3 text-sm font-medium text-foreground">Total</td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                  {assignment?.totalMarks}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Teacher: Submissions table */}
      {isTeacher && (
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">Submissions</h2>
          {!submissions.length ? (
            <EmptyState title="No submissions yet" subtitle="Students haven't submitted their work yet." />
          ) : (
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-raised">
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Student</th>
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Submitted</th>
                    <th className="text-right px-4 py-3 font-medium text-text-secondary">Score</th>
                    <th className="text-right px-4 py-3 font-medium text-text-secondary">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-text-secondary" />
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s._id} className="border-b border-border last:border-0 hover:bg-surface-raised/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{s.student.name}</td>
                      <td className="px-4 py-3 text-text-secondary">{formatDate(s.submittedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {s.status === "graded" && s.totalScore !== undefined && s.maxScore ? (
                          <ScoreBadge score={s.totalScore} maxScore={s.maxScore} />
                        ) : (
                          <span className="text-text-tertiary">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <StatusBadge status={s.status} />
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
          )}
        </div>
      )}

      {/* Student: submit or view submission */}
      {!isTeacher && (
        <div>
          {!mySubmission ? (
            <div>
              <h2 className="text-base font-semibold text-foreground mb-3">Submit Your Work</h2>
              <FileUploadZone
                onFileSelect={setFile}
                selectedFile={file}
                onRemove={() => setFile(null)}
                progress={uploadProgress}
              />
              {file && (
                <div className="mt-4 flex justify-end">
                  <Button onClick={() => submitMutation.mutate()} loading={submitMutation.isPending}>
                    <Send className="h-4 w-4" /> Submit
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Your Submission</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Submitted {formatDate(mySubmission.submittedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={mySubmission.status} />
                  {mySubmission.status === "graded" && (
                    <Button size="sm" onClick={() => navigate(`/submissions/${mySubmission._id}`)}>
                      View Feedback
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit slide-over */}
      {isTeacher && assignment && (
        <AssignmentSlideOver
          open={editOpen}
          onClose={() => setEditOpen(false)}
          classroomId={typeof assignment.classroom === "string" ? assignment.classroom : assignment.classroom._id}
          editData={assignment}
        />
      )}
    </MainLayout>
  );
}
