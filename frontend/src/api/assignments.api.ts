import api from "@/utils/axiosInstance";

export interface RubricCriterion {
  criterion: string;
  description: string;
  maxMarks: number;
}

export interface Assignment {
  _id: string;
  title: string;
  description: string;
  classroom: string | { _id: string; name: string; subject: string };
  dueDate: string;
  rubric: RubricCriterion[];
  status: "draft" | "published" | "closed";
  totalMarks: number;
  submissionCount?: number;
  createdAt: string;
}

export interface CreateAssignmentPayload {
  title: string;
  description: string;
  classroom: string;
  dueDate: string;
  rubric: RubricCriterion[];
}

export const assignmentsApi = {
  create: (payload: CreateAssignmentPayload) =>
    api.post("/assignments", payload).then((r) => r.data.data),
  listByClassroom: (classroomId: string) =>
    api.get(`/assignments/classroom/${classroomId}`).then((r) => r.data.data),
  getById: (id: string) => api.get(`/assignments/${id}`).then((r) => r.data.data),
  update: (id: string, payload: Partial<CreateAssignmentPayload>) =>
    api.patch(`/assignments/${id}`, payload).then((r) => r.data.data),
  publish: (id: string) => api.patch(`/assignments/${id}/publish`).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/assignments/${id}`).then((r) => r.data.data),
};
