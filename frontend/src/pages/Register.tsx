import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "teacher"]),
});

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "student" },
  });

  const role = watch("role");

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await authRegister(values.name, values.email, values.password, values.role);
      toast.success("Account created!");
      navigate("/classrooms");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="lg:hidden mb-8">
        <span className="font-serif text-lg text-foreground">EduAI</span>
      </div>
      <h2 className="font-serif text-xl text-foreground">Create your account</h2>
      <p className="mt-1 text-sm text-text-secondary">Start grading smarter today</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <Input label="Full Name" {...register("name")} error={errors.name?.message} />
        <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
        <Input label="Password" type="password" {...register("password")} error={errors.password?.message} />

        {/* Role pill toggle */}
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">I am a</p>
          <div className="flex rounded-full bg-surface-raised p-1">
            {(["student", "teacher"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setValue("role", r)}
                className={cn(
                  "flex-1 rounded-full py-2 text-sm font-medium transition-all",
                  role === r
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-text-secondary hover:text-foreground"
                )}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
          {errors.role && <p className="mt-1 text-xs text-destructive">{errors.role.message}</p>}
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:text-primary-dark transition-colors">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
