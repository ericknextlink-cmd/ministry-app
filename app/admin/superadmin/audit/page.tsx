"use client";

import { format } from "date-fns";
import { toast } from "sonner";
import { History, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { superAdminApi, AuditLog } from "@/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AuditLogsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  
  // Filters
  const [actionFilter, setActionFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    if (!token) {
        router.push("/auth");
        return;
    }

    try {
        const fetchedLogs = await superAdminApi.getAuditLogs(token, actionFilter, startDate ? new Date(startDate).toISOString() : undefined, endDate ? new Date(endDate).toISOString() : undefined);
        setLogs(fetchedLogs);
    } catch (error: any) {
        console.error("Failed to fetch logs", error);
        toast.error("Failed to fetch audit logs.");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []); // Initial load

  const handleApplyFilter = () => {
      fetchLogs();
  };

  const handleExport = () => {
    if (logs.length === 0) {
        toast.error("No audit logs to export");
        return;
    }

    const headers = ["Timestamp", "User Email", "Action", "Target Type", "Target ID", "Details"];
    const rows = logs.map(log => [
        format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss"),
        log.user_email,
        log.action,
        log.target_type,
        log.target_id,
        log.details || ""
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")) // Handle commas and quotes in data
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `audit_logs_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("Audit logs exported successfully!");
  };

  const handleExportPDF = () => {
    if (logs.length === 0) {
        toast.error("No audit logs to export");
        return;
    }

    const doc = new jsPDF();

    // Add Title
    doc.setFontSize(18);
    doc.text("Audit Log Report", 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${format(new Date(), "MMM d, yyyy HH:mm")}`, 14, 30);

    // Define columns
    const columns = ["Timestamp", "User", "Action", "Target", "Details"];
    const rows = logs.map(log => [
        format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss"),
        log.user_email,
        log.action,
        log.target_label || `${log.target_type} #${log.target_id}`,
        log.details || "-"
    ]);

    autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [3, 55, 131] }, // Matches Ministry Blue
        columnStyles: {
            4: { cellWidth: 50 } // Limit width for details column
        }
    });

    doc.save(`audit_logs_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`);
    toast.success("Audit logs PDF exported successfully!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                <History className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Audit Logs</h1>
        </div>
        <div className="flex gap-2">
            <Button onClick={handleExport} disabled={loading || logs.length === 0} variant="outline" className="flex gap-2">
                <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button onClick={handleExportPDF} disabled={loading || logs.length === 0} className="flex gap-2 bg-[#033783] hover:bg-[#022555] text-white">
                <FileText className="h-4 w-4" /> Export PDF
            </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-2">
            <label className="text-sm font-medium">Action Type</label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="USER_CREATED">User Created</SelectItem>
                    <SelectItem value="USER_ROLE_UPDATED">Role Updated</SelectItem>
                    <SelectItem value="USER_STATUS_UPDATED">Status Updated</SelectItem>
                    <SelectItem value="STATUS_UPDATE_APPROVED">App Approved</SelectItem>
                    <SelectItem value="STATUS_UPDATE_REJECTED">App Rejected</SelectItem>
                    <SelectItem value="STATUS_UPDATE_SUSPENDED">App Suspended</SelectItem>
                    <SelectItem value="APPLICATION_ASSIGNED">App Assigned</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
            />
        </div>

        <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <Input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
            />
        </div>

        <Button onClick={handleApplyFilter} disabled={loading}>
            {loading ? "Loading..." : "Apply Filters"}
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading logs...</td></tr>
                ) : logs.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No activity recorded yet.</td></tr>
                ) : (
                    logs.map((log) => (
                        <tr key={log.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {format(new Date(log.timestamp), "MMM d, yyyy HH:mm:ss")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {log.user_email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600 dark:text-blue-400">
                                {log.action}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={log.details || ""}>
                                {log.details || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {log.target_label || `${log.target_type} #${log.target_id}`}
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
