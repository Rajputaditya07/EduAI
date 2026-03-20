import api from "@/utils/axiosInstance";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: "student" | "teacher";
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
}

export const authApi = {
  register: (payload: RegisterPayload) => api.post("/auth/register", payload).then((r) => r.data.data),
  login: (payload: LoginPayload) => api.post("/auth/login", payload).then((r) => r.data.data),
  refresh: () => api.post("/auth/refresh").then((r) => r.data.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
};
