import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi, type Notification } from "@/api/notifications.api";
import { Bell } from "lucide-react";
import { formatRelative } from "@/utils/helpers";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: notificationsApi.list,
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = notifications.filter((n) => !n.read).length;
  const recent = notifications.slice(0, 5);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = (n: Notification) => {
    if (!n.read) markRead.mutate(n._id);
    if (n.link) navigate(n.link);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-text-secondary hover:bg-surface-raised hover:text-foreground transition-colors"
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-surface shadow-lg z-50">
          <div className="p-3 border-b border-border">
            <p className="text-sm font-medium text-foreground">Notifications</p>
          </div>
          <div className="max-h-72 overflow-y-auto scrollbar-thin">
            {recent.length === 0 ? (
              <p className="p-4 text-center text-sm text-text-tertiary">No notifications yet</p>
            ) : (
              recent.map((n) => (
                <button
                  key={n._id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    "flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-surface-raised transition-colors",
                    !n.read && "bg-primary-light/30"
                  )}
                >
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">{n.message}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">{formatRelative(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
          <button
            onClick={() => {
              navigate("/notifications");
              setOpen(false);
            }}
            className="w-full border-t border-border p-2 text-center text-sm font-medium text-primary hover:bg-surface-raised transition-colors"
          >
            View all
          </button>
        </div>
      )}
    </div>
  );
}
