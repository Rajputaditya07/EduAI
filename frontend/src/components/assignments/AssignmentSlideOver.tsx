import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignmentsApi, type RubricCriterion } from "@/api/assignments.api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RubricBuilder } from "./RubricBuilder";
import { X } from "lucide-react";
import toast from "react-hot-toast";

const prefersReduced =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface AssignmentSlideOverProps {
  open: boolean;
  onClose: () => void;
  classroomId: string;
  editData?: {
    _id: string;
    title: string;
    description: string;
    dueDate: string;
    rubric: RubricCriterion[];
  };
}

export function AssignmentSlideOver({ open, onClose, classroomId, editData }: AssignmentSlideOverProps) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(editData?.title || "");
  const [description, setDescription] = useState(editData?.description || "");
  const [dueDate, setDueDate] = useState(editData?.dueDate?.split("T")[0] || "");
  const [rubric, setRubric] = useState<RubricCriterion[]>(
    editData?.rubric || [{ criterion: "", description: "", maxMarks: 10 }]
  );

  const createMutation = useMutation({
    mutationFn: () =>
      assignmentsApi.create({ title, description, classroom: classroomId, dueDate, rubric }),
    onSuccess: () => {
      toast.success("Assignment created");
      qc.invalidateQueries({ queryKey: ["assignments", classroomId] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      assignmentsApi.update(editData!._id, { title, description, dueDate, rubric }),
    onSuccess: () => {
      toast.success("Assignment updated");
      qc.invalidateQueries({ queryKey: ["assignments"] });
      qc.invalidateQueries({ queryKey: ["assignment", editData!._id] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editData) updateMutation.mutate();
    else createMutation.mutate();
  };

  const totalMarks = rubric.reduce((sum, r) => sum + (r.maxMarks || 0), 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
            initial={prefersReduced ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed right-0 top-0 z-50 h-full w-full max-w-lg bg-surface border-l border-border shadow-lg overflow-y-auto"
            initial={prefersReduced ? {} : { x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-serif text-lg text-foreground">
                {editData ? "Edit Assignment" : "New Assignment"}
              </h2>
              <button onClick={onClose} className="rounded-lg p-1 hover:bg-surface-raised transition-colors" aria-label="Close">
                <X className="h-5 w-5 text-text-secondary" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                <textarea
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-foreground">Rubric</label>
                  <span className="text-xs font-mono text-text-secondary">Total: {totalMarks} marks</span>
                </div>
                <RubricBuilder rubric={rubric} onChange={setRubric} />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                  {editData ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
