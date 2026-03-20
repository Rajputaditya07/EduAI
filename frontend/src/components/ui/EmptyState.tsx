import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

function EmptyState({ title, subtitle, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      {/* Abstract geometric SVG */}
      <svg className="mb-6 h-24 w-24 text-border-strong" viewBox="0 0 96 96" fill="none">
        <rect x="16" y="24" width="64" height="48" rx="8" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="48" cy="48" r="12" stroke="currentColor" strokeWidth="2" />
        <line x1="48" y1="36" x2="48" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="36" y1="48" x2="60" y2="48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {subtitle && <p className="mt-1 max-w-sm text-sm text-text-secondary">{subtitle}</p>}
      {action && (
        <Button className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export { EmptyState };
