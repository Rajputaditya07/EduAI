import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi, type Notification } from "@/api/notifications.api";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useNavigate } from "react-router-dom";
import { formatRelative } from "@/utils/helpers";
import { cn } from "@/lib/utils";
import { Bell, CheckCircle2, Star, Check } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import toast from "react-hot-toast";

function groupByDate(items: Notification[]) {
  const groups: Record<string, Notification[]> = {};
  items.forEach((n) => {
    const d = new Date(n.createdAt);
    const label = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "MMM d, yyyy");
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });
  return groups;
}

const typeIcons: Record<string, React.ReactNode> = {
  grading_complete: <CheckCircle2 className="h-4 w-4 text-success" />,
  new_assignment: <Star className="h-4 w-4 text-warning" />,
  general: <Bell className="h-4 w-4 text-primary" />,
};

export default function Notifications() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: notificationsApi.list,
  });

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      toast.success("All marked as read");
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const grouped = groupByDate(notifications);

  if (isLoading) {
    return (
      <MainLayout>
        <Skeleton className="h-8 w-48 mb-8" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full mb-2 rounded-xl" />
        ))}
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-xl text-foreground">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()} loading={markAllRead.isPending}>
            <Check className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {!notifications.length ? (
        <EmptyState title="No notifications" subtitle="You're all caught up!" />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([label, items]) => (
            <div key={label}>
              <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">{label}</h3>
              <div className="space-y-1">
                {items.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => {
                      if (!n.read) markRead.mutate(n._id);
                      if (n.link) navigate(n.link);
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-surface-raised",
                      !n.read && "bg-primary-light/20"
                    )}
                  >
                    <div className="mt-0.5 shrink-0">{typeIcons[n.type] || typeIcons.general}</div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm", !n.read ? "font-medium text-foreground" : "text-text-secondary")}>
                        {n.message}
                      </p>
                      <p className="text-xs text-text-tertiary mt-0.5">{formatRelative(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
}
