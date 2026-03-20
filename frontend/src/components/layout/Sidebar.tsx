import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { getInitials } from "@/utils/helpers";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Bell,
  User,
  BarChart3,
  TrendingUp,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const prefersReduced =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { to: "/classrooms", icon: <BookOpen className="h-5 w-5" />, label: "Classrooms" },
  { to: "/notifications", icon: <Bell className="h-5 w-5" />, label: "Notifications" },
  { to: "/progress", icon: <TrendingUp className="h-5 w-5" />, label: "My Progress", roles: ["student"] },
  { to: "/analytics", icon: <BarChart3 className="h-5 w-5" />, label: "Analytics", roles: ["teacher"] },
  { to: "/admin", icon: <Shield className="h-5 w-5" />, label: "Admin Panel", roles: ["admin"] },
  { to: "/profile", icon: <User className="h-5 w-5" />, label: "Profile" },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const filteredItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <motion.aside
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-surface"
      animate={{ width: collapsed ? 64 : 240 }}
      transition={prefersReduced ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
    >
      {/* Logo */}
      <div className="flex h-14 items-center px-4 border-b border-border">
        <span className="font-serif text-lg text-foreground whitespace-nowrap overflow-hidden">
          {collapsed ? "E" : "EduAI"}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto scrollbar-thin">
        {filteredItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-light text-primary"
                  : "text-text-secondary hover:bg-surface-raised hover:text-foreground"
              )
            }
            aria-label={item.label}
          >
            {item.icon}
            {!collapsed && (
              <motion.span
                initial={false}
                animate={{ opacity: collapsed ? 0 : 1 }}
                className="whitespace-nowrap overflow-hidden"
              >
                {item.label}
              </motion.span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      {user && (
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
              {getInitials(user.name)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <p className="text-xs text-text-tertiary capitalize">{user.role}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface-raised hover:text-foreground transition-colors"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex h-10 items-center justify-center border-t border-border text-text-secondary hover:text-foreground transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </motion.aside>
  );
}
