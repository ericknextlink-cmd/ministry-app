"use client";

import { useState } from "react";
import { useApplication } from "@/contexts/ApplicationContext";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Lock, Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  const { user, userToken } = useApplication();
  const [activeTab, setActiveTab] = useState<"profile" | "system">("profile");
  
  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
        toast.error("New passwords do not match.");
        return;
    }
    if (!userToken) return;

    setLoading(true);
    try {
        await authApi.updatePassword(currentPassword, newPassword, userToken);
        toast.success("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
    } catch (error: any) {
        toast.error(error.message || "Failed to update password.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Settings</h1>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 w-fit">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${
            activeTab === "profile"
              ? "bg-white shadow text-blue-700 dark:bg-gray-700 dark:text-blue-100"
              : "text-gray-600 hover:bg-white/12 hover:text-blue-800 dark:text-gray-400"
          }`}
        >
            <User className="h-4 w-4" />
            Profile
        </button>
        
        {user?.role === "super_admin" && (
            <button
            onClick={() => setActiveTab("system")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${
                activeTab === "system"
                ? "bg-white shadow text-blue-700 dark:bg-gray-700 dark:text-blue-100"
                : "text-gray-600 hover:bg-white/12 hover:text-blue-800 dark:text-gray-400"
            }`}
            >
                <SettingsIcon className="h-4 w-4" />
                System Settings
            </button>
        )}
      </div>

      {/* Profile Settings */}
      {activeTab === "profile" && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm max-w-2xl border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Lock className="h-5 w-5" /> Change Password
              </h2>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input 
                          id="current-password" 
                          type="password" 
                          required 
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input 
                          id="new-password" 
                          type="password" 
                          required 
                          minLength={8}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                      />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input 
                          id="confirm-password" 
                          type="password" 
                          required 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                  </div>
                  <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={loading}>
                          {loading ? "Updating..." : "Update Password"}
                      </Button>
                  </div>
              </form>
          </div>
      )}

      {/* System Settings (Placeholder) */}
      {activeTab === "system" && user?.role === "super_admin" && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">System Configurations</h2>
              <p className="text-gray-500">
                  Configuration for fees, email templates, and maintenance mode will be implemented here.
              </p>
              {/* Example UI for Fees */}
              <div className="mt-6 opacity-50 pointer-events-none grayscale">
                  <h3 className="font-medium mb-2">Certificate Fees</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <Label>Building - Class D1K1</Label>
                          <Input defaultValue="3500" />
                      </div>
                      <div className="space-y-1">
                          <Label>Electrical - Class E1</Label>
                          <Input defaultValue="1500" />
                      </div>
                  </div>
                  <Button className="mt-4" disabled>Save Changes</Button>
              </div>
          </div>
      )}
    </div>
  );
}



