import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AdminUser, type AdminStats } from "@/api/admin.api";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmModal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/helpers";
import toast from "react-hot-toast";
import {
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  Send,
  CheckCircle2,
  TrendingUp,
  UserCheck,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary">{icon}</div>
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <p className="font-mono text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

export default function Admin() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"users" | "stats">("users");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-users", debouncedSearch, roleFilter, page],
    queryFn: () => adminApi.getUsers({ search: debouncedSearch, role: roleFilter, page, limit: 20 }),
    enabled: tab === "users",
  });

  const { data: stats, isLoading: loadingStats } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: adminApi.getStats,
    enabled: tab === "stats",
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => adminApi.changeRole(id, role),
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      toast.success("User deleted");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setDeleteTarget(null);
    },
  });

  const users: AdminUser[] = Array.isArray(usersData) ? usersData : usersData?.users || [];
  const totalPages = usersData?.totalPages || 1;

  return (
    <MainLayout>
      <h1 className="font-serif text-xl text-foreground mb-6">Admin Panel</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-surface-raised p-1 mb-6 w-fit">
        {(["users", "stats"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t ? "bg-surface text-foreground shadow-sm" : "text-text-secondary hover:text-foreground"
            )}
          >
            {t === "users" ? "Users" : "Platform Stats"}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <input
                className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Search users…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {loadingUsers ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-surface overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-raised">
                      <th className="text-left px-4 py-3 font-medium text-text-secondary">Name</th>
                      <th className="text-left px-4 py-3 font-medium text-text-secondary">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-text-secondary">Role</th>
                      <th className="text-left px-4 py-3 font-medium text-text-secondary">Joined</th>
                      <th className="text-right px-4 py-3 font-medium text-text-secondary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-b border-border last:border-0 hover:bg-surface-raised/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                        <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            onChange={(e) => changeRoleMutation.mutate({ id: u._id, role: e.target.value })}
                            className="rounded-md border border-border bg-surface px-2 py-1 text-xs outline-none focus:border-primary"
                          >
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{formatDate(u.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(u)} className="text-destructive hover:text-destructive">
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-text-secondary">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

          <ConfirmModal
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
            title="Delete User"
            description={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
            loading={deleteMutation.isPending}
          />
        </>
      )}

      {tab === "stats" && (
        <>
          {loadingStats ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={stats.totalUsers} icon={<Users className="h-4 w-4" />} />
              <StatCard label="Students" value={stats.totalStudents} icon={<GraduationCap className="h-4 w-4" />} />
              <StatCard label="Teachers" value={stats.totalTeachers} icon={<UserCheck className="h-4 w-4" />} />
              <StatCard label="Classrooms" value={stats.totalClassrooms} icon={<BookOpen className="h-4 w-4" />} />
              <StatCard label="Assignments" value={stats.totalAssignments} icon={<FileText className="h-4 w-4" />} />
              <StatCard label="Submissions" value={stats.totalSubmissions} icon={<Send className="h-4 w-4" />} />
              <StatCard label="Graded" value={stats.totalGraded} icon={<CheckCircle2 className="h-4 w-4" />} />
              <StatCard label="Avg Score" value={`${stats.averageScore?.toFixed(0)}%`} icon={<TrendingUp className="h-4 w-4" />} />
            </div>
          ) : null}
        </>
      )}
    </MainLayout>
  );
}
