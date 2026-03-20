import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classroomsApi, type Classroom } from "@/api/classrooms.api";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BookOpen, Users, FileText, Plus, KeyRound } from "lucide-react";
import toast from "react-hot-toast";

const prefersReduced =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function ClassroomList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isTeacher = user?.role === "teacher";

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const { data: classrooms, isLoading } = useQuery<Classroom[]>({
    queryKey: ["classrooms"],
    queryFn: classroomsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: () => classroomsApi.create({ name, subject }),
    onSuccess: () => {
      toast.success("Classroom created");
      qc.invalidateQueries({ queryKey: ["classrooms"] });
      setCreateOpen(false);
      setName("");
      setSubject("");
    },
  });

  const joinMutation = useMutation({
    mutationFn: () => classroomsApi.join(joinCode),
    onSuccess: () => {
      toast.success("Joined classroom");
      qc.invalidateQueries({ queryKey: ["classrooms"] });
      setJoinOpen(false);
      setJoinCode("");
    },
  });

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-xl text-foreground">Classrooms</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {isTeacher ? "Manage your classrooms and assignments" : "View your enrolled classrooms"}
          </p>
        </div>
        {isTeacher ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Create Classroom
          </Button>
        ) : (
          <Button onClick={() => setJoinOpen(true)} variant="outline">
            <KeyRound className="h-4 w-4" /> Join with Code
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !classrooms?.length ? (
        <EmptyState
          title={isTeacher ? "No classrooms yet" : "No classrooms joined"}
          subtitle={isTeacher ? "Create your first classroom to get started." : "Ask your teacher for a join code."}
          action={
            isTeacher
              ? { label: "Create Classroom", onClick: () => setCreateOpen(true) }
              : { label: "Join Classroom", onClick: () => setJoinOpen(true) }
          }
        />
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: prefersReduced ? 0 : 0.05 } } }}
        >
          {classrooms.map((c) => (
            <motion.div
              key={c._id}
              variants={prefersReduced ? {} : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.3 }}
              className="rounded-xl border border-border bg-surface p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/classrooms/${c._id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <StatusBadge status={c.archived ? "archived" : "active"} />
              </div>
              <h3 className="text-base font-semibold text-foreground">{c.name}</h3>
              <p className="text-sm text-text-secondary mt-0.5">{c.subject}</p>
              <div className="flex items-center gap-4 mt-4 text-xs text-text-tertiary">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {isTeacher ? `${c.students.length} students` : c.teacher.name}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {c.assignmentCount ?? 0} assignments
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Classroom">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input label="Classroom Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create</Button>
          </div>
        </form>
      </Modal>

      {/* Join Modal */}
      <Modal open={joinOpen} onClose={() => setJoinOpen(false)} title="Join Classroom">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            joinMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input label="Join Code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setJoinOpen(false)}>Cancel</Button>
            <Button type="submit" loading={joinMutation.isPending}>Join</Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
