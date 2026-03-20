import api from "@/utils/axiosInstance";

export interface Notification {
  _id: string;
  user: string;
  type: "grading_complete" | "new_assignment" | "general";
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export const notificationsApi = {
  list: () => api.get("/notifications").then((r) => r.data.data),
  markAllRead: () => api.patch("/notifications/read-all").then((r) => r.data),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
};
