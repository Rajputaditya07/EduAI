import React, { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { queryClient } from "@/utils/queryClient";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

// Lazy-loaded pages
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ClassroomList = lazy(() => import("./pages/ClassroomList"));
const ClassroomDetail = lazy(() => import("./pages/ClassroomDetail"));
const AssignmentDetail = lazy(() => import("./pages/AssignmentDetail"));
const SubmissionDetail = lazy(() => import("./pages/SubmissionDetail"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Progress = lazy(() => import("./pages/Progress"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "hsl(var(--surface))",
            color: "hsl(var(--foreground))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "12px",
            fontSize: "14px",
            fontFamily: '"DM Sans", system-ui, sans-serif',
          },
        }}
      />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected — all roles */}
            <Route path="/dashboard" element={<Navigate to="/classrooms" replace />} />
            <Route
              path="/classrooms"
              element={
                <ProtectedRoute>
                  <ClassroomList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/classrooms/:id"
              element={
                <ProtectedRoute>
                  <ClassroomDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments/:id"
              element={
                <ProtectedRoute>
                  <AssignmentDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/submissions/:id"
              element={
                <ProtectedRoute>
                  <SubmissionDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Teacher only */}
            <Route
              path="/analytics/:classroomId"
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={["teacher"]}>
                  <ClassroomList />
                </ProtectedRoute>
              }
            />

            {/* Student only */}
            <Route
              path="/progress"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <Progress />
                </ProtectedRoute>
              }
            />

            {/* Admin only */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Admin />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
