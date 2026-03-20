import React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: "bg-primary-light text-primary border-transparent",
    outline: "border-border text-text-secondary bg-transparent",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

/* StatusBadge */
type Status = "draft" | "published" | "closed" | "pending" | "grading" | "graded" | "error" | "active" | "archived";

const statusStyles: Record<Status, string> = {
  draft: "bg-surface-raised text-text-secondary",
  published: "bg-primary-light text-primary",
  closed: "bg-warning-light text-warning",
  pending: "bg-warning-light text-warning",
  grading: "bg-primary-light text-primary animate-pulse-subtle",
  graded: "bg-success-light text-success",
  error: "bg-destructive-light text-destructive",
  active: "bg-success-light text-success",
  archived: "bg-surface-raised text-text-secondary",
};

const statusLabels: Record<Status, string> = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
  pending: "Pending",
  grading: "Grading…",
  graded: "Graded",
  error: "Error",
  active: "Active",
  archived: "Archived",
};

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: Status;
}

function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        statusStyles[status],
        className
      )}
      {...props}
    >
      {statusLabels[status]}
    </span>
  );
}

/* ScoreBadge */
interface ScoreBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  score: number;
  maxScore: number;
}

function ScoreBadge({ score, maxScore, className, ...props }: ScoreBadgeProps) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const color =
    pct >= 80
      ? "bg-success-light text-success"
      : pct >= 40
      ? "bg-warning-light text-warning"
      : "bg-destructive-light text-destructive";

  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-mono font-medium", color, className)}
      {...props}
    >
      {score}/{maxScore}
    </span>
  );
}

export { Badge, StatusBadge, ScoreBadge };
export type { BadgeProps, StatusBadgeProps, ScoreBadgeProps, Status };
