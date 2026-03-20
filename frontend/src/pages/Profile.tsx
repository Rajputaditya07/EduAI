import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import api from "@/utils/axiosInstance";
import toast from "react-hot-toast";

export default function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.patch("/auth/profile", { name });
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setSavingPassword(true);
    try {
      await api.patch("/auth/change-password", { currentPassword, newPassword });
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <MainLayout>
      <h1 className="font-serif text-xl text-foreground mb-8">Profile</h1>

      {/* Personal Info */}
      <form onSubmit={handleProfileSave} className="rounded-xl border border-border bg-surface p-6 shadow-sm mb-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Personal Information</h2>
        <div className="space-y-4 max-w-md">
          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="relative">
            <Input label="Email" value={user?.email || ""} disabled />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-tertiary">Read only</span>
          </div>
        </div>
        <div className="mt-6">
          <Button type="submit" loading={savingProfile}>Save Changes</Button>
        </div>
      </form>

      {/* Change Password */}
      <form onSubmit={handlePasswordSave} className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-4">Change Password</h2>
        <div className="space-y-4 max-w-md">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <div className="mt-6">
          <Button type="submit" loading={savingPassword}>Change Password</Button>
        </div>
      </form>
    </MainLayout>
  );
}
