import api from "@/utils/axiosInstance";

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalClassrooms: number;
  totalAssignments: number;
  totalSubmissions: number;
  totalGraded: number;
  averageScore: number;
}

export interface AdminUsersParams {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const adminApi = {
  getUsers: (params: AdminUsersParams) =>
    api.get("/admin/users", { params }).then((r) => r.data.data),
  changeRole: (id: string, role: string) =>
    api.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data.data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`).then((r) => r.data),
  getStats: () => api.get("/admin/stats").then((r) => r.data.data),
};
