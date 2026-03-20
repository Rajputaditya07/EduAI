import api from "@/utils/axiosInstance";

export interface CriterionFeedback {
  criterion: string;
  score: number;
  maxMarks: number;
  feedback: string;
}

export interface Submission {
  _id: string;
  assignment: string | { _id: string; title: string; classroom: { _id: string; name: string } };
  student: { _id: string; name: string; email: string };
  fileUrl: string;
  fileName: string;
  status: "pending" | "grading" | "graded" | "error";
  totalScore?: number;
  maxScore?: number;
  overallFeedback?: string;
  criteriaFeedback?: CriterionFeedback[];
  submittedAt: string;
  gradedAt?: string;
  errorMessage?: string;
}

export const submissionsApi = {
  submit: (file: File, assignmentId: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("assignmentId", assignmentId);
    return api.post("/submissions", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data.data);
  },
  listByAssignment: (assignmentId: string) =>
    api.get(`/submissions/assignment/${assignmentId}`).then((r) => r.data.data),
  getMySubmission: (assignmentId: string) =>
    api.get(`/submissions/my/${assignmentId}`).then((r) => r.data.data),
  getAllMy: () => api.get("/submissions/student/all").then((r) => r.data.data),
  getById: (id: string) => api.get(`/submissions/${id}`).then((r) => r.data.data),
};
