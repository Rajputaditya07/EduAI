import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export function useSSE() {
  const qc = useQueryClient();
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef(0);
  const maxDelay = 30000;

  const connect = useCallback(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return; // Don't connect without auth

    // EventSource can't send headers, so pass token as query param
    const es = new EventSource(`${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`);
    esRef.current = es;

    es.addEventListener("connected", () => {
      retryRef.current = 0;
    });

    es.addEventListener("grading_complete", (e) => {
      const data = JSON.parse(e.data);
      toast.success("Your submission has been graded ✓");
      qc.invalidateQueries({ queryKey: ["submission", data.submissionId] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    });

    es.addEventListener("new_assignment", () => {
      toast("New assignment posted", { icon: "📝" });
      qc.invalidateQueries({ queryKey: ["classrooms"] });
      qc.invalidateQueries({ queryKey: ["assignments"] });
    });

    es.onerror = () => {
      es.close();
      const delay = Math.min(2000 * Math.pow(2, retryRef.current), maxDelay);
      retryRef.current++;
      setTimeout(connect, delay);
    };
  }, [qc]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
    };
  }, [connect]);
}
