import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, type User } from "@/api/auth.api";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: "student" | "teacher") => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: localStorage.getItem("accessToken"),
    isLoading: true,
  });

  // Attempt silent refresh on mount
  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const data = await authApi.refresh();
        localStorage.setItem("accessToken", data.accessToken);
        setState({ user: data.user, accessToken: data.accessToken, isLoading: false });
      } catch {
        localStorage.removeItem("accessToken");
        setState({ user: null, accessToken: null, isLoading: false });
      }
    };
    tryRefresh();
  }, []);

  useEffect(() => {
    const handleForceLogout = () => {
      setState((prev) => ({ ...prev, user: null, accessToken: null, isLoading: false }));
    };
    window.addEventListener("forceLogout", handleForceLogout);
    return () => window.removeEventListener("forceLogout", handleForceLogout);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem("accessToken", data.accessToken);
    setState({ user: data.user, accessToken: data.accessToken, isLoading: false });
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role: "student" | "teacher") => {
    const data = await authApi.register({ name, email, password, role });
    localStorage.setItem("accessToken", data.accessToken);
    setState({ user: data.user, accessToken: data.accessToken, isLoading: false });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem("accessToken");
    setState({ user: null, accessToken: null, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
