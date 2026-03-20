import api from "@/utils/axiosInstance";

export const gradingApi = {
  retry: (submissionId: string) =>
    api.post(`/grading/retry/${submissionId}`).then((r) => r.data.data),
};
