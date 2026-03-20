import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { NotificationBell } from "./NotificationBell";
import { getInitials } from "@/utils/helpers";

const routeTitles: Record<string, string> = {
  "/classrooms": "Classrooms",
  "/notifications": "Notifications",
  "/progress": "My Progress",
  "/admin": "Admin Panel",
  "/profile": "Profile",
};

export function Header() {
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Derive page title
  const path = location.pathname;
  let title = routeTitles[path] || "";
  if (path.startsWith("/classrooms/")) title = "Classroom";
  if (path.startsWith("/assignments/")) title = "Assignment";
  if (path.startsWith("/submissions/")) title = "Submission";
  if (path.startsWith("/analytics")) title = "Analytics";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/80 backdrop-blur-sm px-6">
      <h1 className="font-serif text-lg text-foreground">{title}</h1>
      <div className="flex items-center gap-4">
        <NotificationBell />
        {user && (
          <button
            onClick={() => navigate("/profile")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised text-sm font-medium text-foreground hover:ring-2 hover:ring-primary/30 transition-all"
            aria-label="Profile"
          >
            {getInitials(user.name)}
          </button>
        )}
      </div>
    </header>
  );
}
