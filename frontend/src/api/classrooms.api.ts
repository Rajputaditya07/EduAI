import api from "@/utils/axiosInstance";

export interface Classroom {
  _id: string;
  name: string;
  subject: string;
  teacher: { _id: string; name: string; email: string };
  joinCode: string;
  students: string[];
  assignmentCount?: number;
  archived?: boolean;
  createdAt: string;
}

export interface ClassroomStudent {
  _id: string;
  name: string;
  email: string;
  submissionsCount: number;
  averageScore: number;
}

export const classroomsApi = {
  create: (payload: { name: string; subject: string }) =>
    api.post("/classrooms", payload).then((r) => r.data.data),
  list: () => api.get("/classrooms").then((r) => r.data.data),
  getById: (id: string) => api.get(`/classrooms/${id}`).then((r) => r.data.data),
  join: (joinCode: string) => api.post("/classrooms/join", { joinCode }).then((r) => r.data.data),
  getStudents: (id: string) => api.get(`/classrooms/${id}/students`).then((r) => r.data.data),
  archive: (id: string) => api.patch(`/classrooms/${id}/archive`).then((r) => r.data.data),
};
