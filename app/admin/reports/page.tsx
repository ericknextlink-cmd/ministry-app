"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminApi, Application } from "@/lib/api";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Download, Calendar, FileText } from "lucide-react";
import * as XLSX from "xlsx"; // You might not have this, I'll use simple CSV blob
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const fetchReports = async () => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    if (!token) {
        router.push("/auth");
        return;
    }

    try {
        const status = statusFilter === "all" ? undefined : statusFilter;
        // Ensure dates are ISO 8601 if needed, but native date input returns YYYY-MM-DD which is usually fine
        const data = await adminApi.getApplications(token, status, startDate ? new Date(startDate).toISOString() : undefined, endDate ? new Date(endDate).toISOString() : undefined);
        setApplications(data);
    } catch (error: any) {
        console.error("Failed to fetch reports", error);
        toast.error("Failed to fetch reports.");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []); // Initial load

  const handleExport = () => {
    if (applications.length === 0) {
        toast.error("No data to export");
        return;
    }

    // Define CSV headers and rows
    const headers = ["ID", "Company", "Email", "Status", "Certificate Type", "Class", "User ID", "Created At", "Updated At", "Expiry Date"];
    const rows = applications.map(app => [
        app.id,
        app.company_name || "N/A",
        app.user_email || "N/A",
        app.status,
        app.certificate_type,
        app.certificate_class || "N/A",
        app.user_id,
        format(new Date(app.created_at), "yyyy-MM-dd HH:mm:ss"),
        format(new Date(app.updated_at), "yyyy-MM-dd HH:mm:ss"),
        app.expiry_date ? format(new Date(app.expiry_date), "yyyy-MM-dd") : "N/A"
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(','))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `applications_report_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleExportPDF = () => {
    if (applications.length === 0) {
        toast.error("No data to export");
        return;
    }

    const doc = new jsPDF();

    // Add Title
    doc.setFontSize(18);
    doc.text("Certification Report", 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${format(new Date(), "MMM d, yyyy HH:mm")}`, 14, 30);

    // Define columns
    const columns = ["ID", "Company", "Email", "Type", "Status", "Submitted On", "Expiry"];
    const rows = applications.map(app => [
        app.id,
        app.company_name || "-",
        app.user_email || "-",
        app.certificate_type,
        app.status,
        format(new Date(app.created_at), "yyyy-MM-dd"),
        app.expiry_date ? format(new Date(app.expiry_date), "yyyy-MM-dd") : "-"
    ]);

    autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [3, 55, 131] } // Matches Ministry Blue
    });

    doc.save(`applications_report_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Certification Reports</h1>
        <div className="flex gap-2">
            <Button onClick={handleExport} disabled={loading || applications.length === 0} variant="outline" className="flex gap-2">
                <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button onClick={handleExportPDF} disabled={loading || applications.length === 0} className="bg-[#033783] hover:bg-[#022555] text-white flex gap-2">
                <FileText className="h-4 w-4" /> Export PDF
            </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending_payment">Pending Payment</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <input 
                type="date" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
            />
        </div>

        <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <input 
                type="date" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
            />
        </div>

        <Button onClick={fetchReports} disabled={loading}>
            {loading ? "Loading..." : "Generate Report"}
        </Button>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted On</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {applications.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No records found matching your filters.</td>
                    </tr>
                ) : (
                    applications.map((app) => (
                        <tr key={app.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white" title={String(app.id)}>
                              {typeof app.id === "string" && app.id.length > 12 ? `${app.id.slice(0, 8)}…` : `#${app.id}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.company_name || "-"}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.user_email || "-"}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{app.certificate_type}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${app.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                      app.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                      'bg-yellow-100 text-yellow-800'}`}>
                                    {app.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {format(new Date(app.created_at), "MMM d, yyyy")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {app.expiry_date ? format(new Date(app.expiry_date), "MMM d, yyyy") : "-"}
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


