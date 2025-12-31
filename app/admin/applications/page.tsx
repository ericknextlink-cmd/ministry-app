"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RecentApplicationsTable } from "@/components/admin/data-table";
import { adminApi, Application } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
        fetchApplications();
    }, 500);
    return () => clearTimeout(timer);
  }, [statusFilter, typeFilter, searchQuery]);

  const fetchApplications = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
        router.push("/auth");
        return;
    }

    setLoading(true);
    try {
        const status = statusFilter === "all" ? undefined : statusFilter;
        const type = typeFilter === "all" ? undefined : typeFilter;
        
        const appsData = await adminApi.getApplications(
            token, 
            status, 
            undefined, // startDate
            undefined, // endDate
            type,
            searchQuery
        );
        setApplications(appsData);
    } catch (error: any) {
        console.error("Failed to load applications", error);
        toast.error("Failed to load applications.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">All Applications</h1>
        
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                    placeholder="Search company or email..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="building">Building</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="civil">Civil</SelectItem>
                </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="pending_payment">Pending Payment</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      {loading ? (
          <div className="p-12 text-center text-gray-500">Loading applications...</div>
      ) : (
          <RecentApplicationsTable data={applications} />
      )}
    </div>
  );
}
