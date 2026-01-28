"use client";

import { useState } from "react";
import { useApplication } from "@/contexts/ApplicationContext";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, User, Phone, Mail, Lock, BookOpen } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";

export default function ProfilePage() {
  const { user, userToken, refreshUser } = useApplication();
  const [loading, setLoading] = useState(false);
  
  // Layout State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || "");

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [tutorialLoading, setTutorialLoading] = useState(false);
  const router = useRouter();

  const handleShowTutorialAgain = async () => {
    if (!userToken) return;
    setTutorialLoading(true);
    try {
      await authApi.updateProfile({ tutorials_completed: false }, userToken);
      await refreshUser();
      toast.success("Tutorial will show on the next dashboard visit.");
      router.push("/dashboard");
    } catch (e: any) {
      toast.error(e?.message || "Failed to reset tutorial.");
    } finally {
      setTutorialLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToken) return;
    setLoading(true);

    try {
        await authApi.updateProfile({ full_name: fullName, phone_number: phoneNumber }, userToken);
        await refreshUser();
        toast.success("Profile updated successfully!");
    } catch (error: any) {
        toast.error(error.message || "Failed to update profile");
    } finally {
        setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToken) return;
    
    if (newPassword !== confirmPassword) {
        toast.error("New passwords do not match");
        return;
    }

    if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
    }

    setPasswordLoading(true);
    try {
        await authApi.updatePassword(currentPassword, newPassword, userToken);
        toast.success("Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
    } catch (error: any) {
        toast.error(error.message || "Failed to update password");
    } finally {
        setPasswordLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900 relative">
      <DashboardSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50 dark:bg-gray-900">
            <div className="container mx-auto max-w-4xl space-y-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Account Settings</h1>

                <div className="grid gap-8 md:grid-cols-2">
                    {/* Profile Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your personal details.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input 
                                            id="email" 
                                            value={user?.email || ""} 
                                            disabled 
                                            className="pl-9 bg-gray-100 dark:bg-gray-800" 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input 
                                            id="fullName" 
                                            placeholder="John Doe" 
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input 
                                            id="phone" 
                                            placeholder="+233 20 123 4567" 
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <Button type="submit" disabled={loading} className="w-full bg-[#033783] hover:bg-[#022555]">
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Change Password */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Security</CardTitle>
                            <CardDescription>Update your password.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Current Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input 
                                            id="currentPassword" 
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input 
                                            id="newPassword" 
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input 
                                            id="confirmPassword" 
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <Button type="submit" disabled={passwordLoading} variant="outline" className="w-full">
                                    {passwordLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Password"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* App tutorial */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            App tutorial
                        </CardTitle>
                        <CardDescription>
                            Show the in-app guide again on your next dashboard visit.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={tutorialLoading}
                            onClick={handleShowTutorialAgain}
                        >
                            {tutorialLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
                            Show tutorial again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </main>
      </div>
    </div>
  );
}
