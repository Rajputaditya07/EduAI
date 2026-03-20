import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, MessageSquare, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/Button";

const prefersReduced =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const stagger = {
  animate: { transition: { staggerChildren: prefersReduced ? 0 : 0.1 } },
};

const fadeUp = prefersReduced
  ? {}
  : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };

const features = [
  {
    icon: <Brain className="h-6 w-6" />,
    title: "AI Grading",
    desc: "Assignments are graded against your rubric by AI — consistent, fast, fair.",
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: "Real-time Feedback",
    desc: "Students receive structured, criterion-level feedback within minutes of submission.",
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Analytics",
    desc: "Teachers see which criteria students struggle with. Students track growth over time.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Gradient mesh background */}
      <div
        className="absolute inset-0 opacity-30 animate-gradient-mesh"
        style={{
          backgroundImage:
            "radial-gradient(at 20% 30%, hsl(var(--primary-light)) 0%, transparent 50%), radial-gradient(at 80% 60%, hsl(var(--warning-light)) 0%, transparent 50%), radial-gradient(at 50% 80%, hsl(var(--success-light)) 0%, transparent 50%)",
          backgroundSize: "200% 200%",
        }}
      />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="font-serif text-lg text-foreground">EduAI</span>
        <Link to="/login" className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
          Login
        </Link>
      </header>

      {/* Hero */}
      <motion.section
        className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-16 max-w-3xl mx-auto"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        <motion.h1
          className="font-serif text-2xl sm:text-[48px] sm:leading-[56px] text-foreground"
          variants={fadeUp}
          transition={{ duration: 0.5 }}
        >
          The classroom, intelligently graded.
        </motion.h1>
        <motion.p
          className="mt-4 text-base text-text-secondary max-w-lg"
          variants={fadeUp}
          transition={{ duration: 0.5 }}
        >
          Teachers set rubrics. Students submit work. AI delivers structured feedback in seconds — not days.
        </motion.p>
        <motion.div className="mt-8 flex gap-3" variants={fadeUp} transition={{ duration: 0.5 }}>
          <Link to="/register">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg">Login</Button>
          </Link>
        </motion.div>
      </motion.section>

      {/* Features */}
      <motion.section
        className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 px-6 pb-24 max-w-5xl mx-auto"
        variants={stagger}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
      >
        {features.map((f) => (
          <motion.div
            key={f.title}
            className="rounded-xl border border-border bg-surface p-6 shadow-sm"
            variants={fadeUp}
            transition={{ duration: 0.4 }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary mb-4">
              {f.icon}
            </div>
            <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
            <p className="mt-2 text-sm text-text-secondary">{f.desc}</p>
          </motion.div>
        ))}
      </motion.section>
    </div>
  );
}
