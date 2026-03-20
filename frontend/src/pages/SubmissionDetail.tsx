import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { submissionsApi, type Submission } from "@/api/submissions.api";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/utils/helpers";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

const prefersReduced =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function CriterionScoreBar({
  criterion,
  score,
  maxMarks,
  feedback,
  delay,
}: {
  criterion: string;
  score: number;
  maxMarks: number;
  feedback: string;
  delay: number;
}) {
  const pct = maxMarks > 0 ? (score / maxMarks) * 100 : 0;
  const color =
    pct >= 80 ? "bg-success" : pct >= 40 ? "bg-warning" : "bg-destructive";

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-foreground">{criterion}</h4>
        <span className="font-mono text-sm text-foreground">
          {score}/{maxMarks}
        </span>
      </div>
      <div
        className="h-2 w-full rounded-full bg-surface-raised overflow-hidden mb-3"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={maxMarks}
        aria-label={`${criterion}: ${score} out of ${maxMarks}`}
      >
        <motion.div
          className={cn("h-full rounded-full", color)}
          initial={{ width: prefersReduced ? `${pct}%` : "0%" }}
          animate={{ width: `${pct}%` }}
          transition={prefersReduced ? { duration: 0 } : { duration: 0.6, delay, ease: "easeOut" }}
        />
      </div>
      <p className="text-sm text-text-secondary">{feedback}</p>
    </div>
  );
}

const statusBannerStyles: Record<string, string> = {
  pending: "bg-warning-light text-warning border-warning/20",
  grading: "bg-primary-light text-primary border-primary/20 animate-pulse-subtle",
  graded: "bg-success-light text-success border-success/20",
  error: "bg-destructive-light text-destructive border-destructive/20",
};

const statusMessages: Record<string, string> = {
  pending: "Your submission is in the queue and will be graded soon.",
  grading: "AI is grading your submission right now…",
  graded: "Your submission has been graded.",
  error: "There was an error grading your submission.",
};

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: submission, isLoading } = useQuery<Submission>({
    queryKey: ["submission", id],
    queryFn: () => submissionsApi.getById(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "grading" ? 5000 : false;
    },
  });

  const countUpScore = useCountUp(submission?.totalScore || 0);

  if (isLoading) {
    return (
      <MainLayout>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-48 mb-6" />
        <Skeleton className="h-12 w-full mb-8 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </MainLayout>
    );
  }

  const assignmentData = typeof submission?.assignment === "object" ? submission.assignment : null;
  const status = submission?.status || "pending";

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-xl text-foreground">
          {assignmentData?.title || "Submission"}
        </h1>
        <div className="flex items-center gap-3 mt-1 text-sm text-text-secondary">
          {assignmentData?.classroom?.name && <span>{assignmentData.classroom.name}</span>}
          <span>•</span>
          <span>Submitted {formatDateTime(submission?.submittedAt || "")}</span>
        </div>
      </div>

      {/* Status banner */}
      <div
        className={cn(
          "rounded-xl border px-4 py-3 mb-8 text-sm font-medium",
          statusBannerStyles[status]
        )}
      >
        {statusMessages[status]}
      </div>

      {/* Graded: Feedback Card */}
      {status === "graded" && submission && (
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Overall score */}
          <div className="flex flex-col items-center mb-8">
            <CircularProgress
              value={submission.totalScore || 0}
              max={submission.maxScore || 1}
              size={140}
              strokeWidth={10}
            >
              <div className="text-center">
                <span className="font-mono text-2xl font-semibold text-foreground">
                  {countUpScore}
                </span>
                <span className="font-mono text-base text-text-tertiary">
                  /{submission.maxScore}
                </span>
              </div>
            </CircularProgress>
          </div>

          {/* Overall feedback */}
          {submission.overallFeedback && (
            <div className="rounded-xl border border-border bg-surface p-5 mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-2">Overall Feedback</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{submission.overallFeedback}</p>
            </div>
          )}

          {/* Per-criterion */}
          <h3 className="text-base font-semibold text-foreground mb-3">Criterion Breakdown</h3>
          <div className="space-y-3">
            {submission.criteriaFeedback?.map((cf, i) => (
              <CriterionScoreBar
                key={cf.criterion}
                criterion={cf.criterion}
                score={cf.score}
                maxMarks={cf.maxMarks}
                feedback={cf.feedback}
                delay={i * 0.1}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Pending/Grading skeleton */}
      {(status === "pending" || status === "grading") && (
        <div className="space-y-4">
          <div className="flex flex-col items-center mb-8">
            <Skeleton className="h-[140px] w-[140px] rounded-full" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="rounded-xl border border-destructive/20 bg-destructive-light p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive mb-3" />
          <h3 className="text-base font-semibold text-destructive">Grading Error</h3>
          <p className="mt-1 text-sm text-text-secondary">
            {submission?.errorMessage || "An unexpected error occurred."}
          </p>
          <p className="mt-3 text-xs text-text-tertiary">Contact your teacher for assistance.</p>
        </div>
      )}
    </MainLayout>
  );
}
