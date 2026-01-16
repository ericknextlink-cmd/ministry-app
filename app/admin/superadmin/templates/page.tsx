"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText, Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

// Expected templates based on system logic
const REQUIRED_TEMPLATES = [
  { id: "electrical.pdf", label: "Electrical Works Certificate" },
  { id: "building.pdf", label: "Building & Civil Works Certificate" },
  { id: "plumbing.pdf", label: "Plumbing Works Certificate" },
];

interface TemplateFile {
  name: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: any;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<TemplateFile[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    if (!token) {
      console.warn("fetchTemplates: No access token found");
      setLoading(false);
      return;
    }

    try {
      const data = await adminApi.listTemplates(token);
      setTemplates(data || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("fetchTemplates: Failed to fetch templates", {
        message: error.message,
        stack: error.stack
      });
      toast.error(error.message || "Failed to load templates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleUploadClick = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset
        fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTemplateId) return;

    // Validate name matches expected ID (strict mode)
    // Actually, we should rename the file to match the ID automatically to avoid user error
    // But for clarity, we can just rename it in the FormData or checking it.
    // Let's create a new File object with the correct name to ensure backend gets "electrical.pdf" even if user uploaded "draft_v2.pdf"
    
    const renamedFile = new File([file], selectedTemplateId, { type: "application/pdf" });

    setUploadingId(selectedTemplateId);
    const token = localStorage.getItem("access_token");
    
    try {
        if (!token) {
          const error = new Error("Not authenticated");
          console.error("handleFileChange: Authentication error", error);
          toast.error("Please log in again.");
          return;
        }
        
        await adminApi.uploadTemplate(renamedFile, token);
        toast.success(`${selectedTemplateId} updated successfully!`);
        await fetchTemplates();
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("handleFileChange: Failed to upload template", {
          message: error.message,
          stack: error.stack,
          templateId: selectedTemplateId,
          fileName: file.name,
          fileSize: file.size
        });
        toast.error(error.message || "Upload failed.");
    } finally {
        setUploadingId(null);
        setSelectedTemplateId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Certificate Templates</h1>
            <p className="text-gray-500 mt-2">Manage the PDF templates used for generating certificates.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Hidden File Input */}
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="application/pdf"
            onChange={handleFileChange}
        />

        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {REQUIRED_TEMPLATES.map((req) => {
                    const existing = templates.find(t => t.name === req.id);
                    const isUploading = uploadingId === req.id;

                    return (
                        <tr key={req.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{req.label}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                {req.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {existing ? (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 items-center gap-1">
                                        <CheckCircle className="h-3 w-3" /> Available
                                    </span>
                                ) : (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 items-center gap-1">
                                        <AlertCircle className="h-3 w-3" /> Missing
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {existing && existing.updated_at ? (
                                    format(new Date(existing.updated_at), "MMM d, yyyy HH:mm")
                                ) : (
                                    "-"
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleUploadClick(req.id)}
                                    disabled={loading || isUploading}
                                    className="gap-2"
                                >
                                    {isUploading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Upload className="h-4 w-4" />
                                    )}
                                    {existing ? "Replace" : "Upload"}
                                </Button>
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
