"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { superAdminApi } from "@/lib/api";
import { User } from "@/lib/api"; // Re-using User interface from api.ts
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Check, X, Plus } from "lucide-react";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { UserRole } from "@/lib/api";

export default function SuperAdminUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<UserRole | "all">("all");
  
  const fetchUsers = async () => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    if (!token) {
        router.push("/auth");
        return;
    }

    try {
        const fetchedUsers = await superAdminApi.getUsers(token);
        setUsers(fetchedUsers);
    } catch (error: any) {
        console.error("Failed to fetch users", error);
        toast.error(error.message || "Failed to fetch users. Are you a Super Admin?");
        if (error.message.includes("403") || error.message.includes("401")) {
            router.push("/auth");
        }
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: number, newRole: User["role"]) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
        toast.error("Not authenticated.");
        router.push("/auth");
        return;
    }
    try {
        await superAdminApi.updateUserRole(userId, newRole, token);
        toast.success("User role updated successfully!");
        fetchUsers(); // Refresh the list
    } catch (error: any) {
        toast.error(error.message || "Failed to update user role.");
        console.error(error);
    }
  };

  const handleToggleActive = async (userId: number, isActive: boolean) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
        toast.error("Not authenticated.");
        router.push("/auth");
        return;
    }
    try {
        await superAdminApi.toggleUserActiveStatus(userId, isActive, token);
        toast.success(`User ${isActive ? "activated" : "deactivated"} successfully!`);
        fetchUsers(); // Refresh the list
    } catch (error: any) {
        toast.error(error.message || "Failed to toggle user status.");
        console.error(error);
    }
  };

  const handleCreateUser = async (data: { email: string; password: string; role: UserRole }) => {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      
      try {
          await superAdminApi.createUser(data, data.role, token);
          toast.success("User created successfully!");
          fetchUsers();
      } catch (error: any) {
          console.error(error);
          throw new Error(error.message || "Failed to create user");
      }
  };

  const filteredUsers = users.filter(user => {
    if (activeFilter === "all") return true;
    return user.role === activeFilter;
  });


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">User Management</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Create User
        </Button>
      </div>

      <CreateUserDialog 
        isOpen={isCreateDialogOpen} 
        onClose={() => setIsCreateDialogOpen(false)} 
        onSubmit={handleCreateUser} 
      />

      {/* Tabs for filtering */}
      <div className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 w-fit">
        <button
          onClick={() => setActiveFilter("all")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${
            activeFilter === "all"
              ? "bg-white shadow text-blue-700 dark:bg-gray-700 dark:text-blue-100"
              : "text-gray-600 hover:bg-white/[0.12] hover:text-blue-800 dark:text-gray-400"
          }`}
        >
            All Users
        </button>
        <button
          onClick={() => setActiveFilter("super_admin")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${
            activeFilter === "super_admin"
              ? "bg-white shadow text-blue-700 dark:bg-gray-700 dark:text-blue-100"
              : "text-gray-600 hover:bg-white/[0.12] hover:text-blue-800 dark:text-gray-400"
          }`}
        >
            Super Admins
        </button>
        <button
          onClick={() => setActiveFilter("admin")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${
            activeFilter === "admin"
              ? "bg-white shadow text-blue-700 dark:bg-gray-700 dark:text-blue-100"
              : "text-gray-600 hover:bg-white/[0.12] hover:text-blue-800 dark:text-gray-400"
          }`}
        >
            Admins (Staff)
        </button>
        <button
          onClick={() => setActiveFilter("user")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${
            activeFilter === "user"
              ? "bg-white shadow text-blue-700 dark:bg-gray-700 dark:text-blue-100"
              : "text-gray-600 hover:bg-white/[0.12] hover:text-blue-800 dark:text-gray-400"
          }`}
        >
            Applicants (Users)
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                    <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading users...</td>
                    </tr>
                ) : filteredUsers.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No users found matching current filter.</td>
                    </tr>
                ) : (
                    filteredUsers.map((user) => (
                        <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#{user.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <Select value={user.role} onValueChange={(newRole) => handleRoleChange(user.id, newRole as User["role"])}>
                                    <SelectTrigger className="w-[180px] capitalize">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="super_admin">Super Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {user.is_active ? (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                ) : (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Inactive</span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleToggleActive(user.id, !user.is_active)}
                                    className="mr-2"
                                >
                                    {user.is_active ? <X className="h-4 w-4 text-red-500" /> : <Check className="h-4 w-4 text-green-500" />}
                                </Button>
                                {/* Future: Reset Password, Delete User */}
                            </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
