import api from "@/utils/axiosInstance";

export interface ClassroomAnalytics {
  totalAssignments: number;
  submissionRate: number;
  classAverage: number;
  gradedCount: number;
  assignments: Array<{
    _id: string;
    title: string;
    submissionRate: number;
    averageScore: number;
    totalSubmissions: number;
  }>;
  criterionAverages: Array<{
    criterion: string;
    assignments: Array<{ assignmentId: string; title: string; average: number; maxMarks: number }>;
  }>;
  scoreDistribution: { bucket: string; count: number }[];
}

export interface StudentProgress {
  overallAverage: number;
  scoreHistory: Array<{ assignment: string; classroom: string; percentage: number; submittedAt: string }>;
  criterionStrengths: Array<{ criterion: string; averagePercentage: number }>;
  submissions: Array<{
    _id: string;
    assignmentTitle: string;
    classroom: string;
    submittedAt: string;
    score: number;
    maxScore: number;
    status: string;
  }>;
}

export const analyticsApi = {
  classroomAnalytics: (classroomId: string) =>
    api.get(`/submissions/analytics/classroom/${classroomId}`).then((r) => r.data.data),
  assignmentAnalytics: (assignmentId: string) =>
    api.get(`/submissions/analytics/assignment/${assignmentId}`).then((r) => r.data.data),
  myProgress: () => api.get("/submissions/analytics/my-progress").then((r) => r.data.data),
};
