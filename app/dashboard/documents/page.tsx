"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

interface DocumentFile {
  id: string;
  name: string;
  file: File | null;
  fileName: string;
  status: "uploaded" | "not-uploaded";
}

export default function DocumentsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  
  const [documents, setDocuments] = useState<DocumentFile[]>([
    { id: "1", name: "Incorporation Certificate", file: null, fileName: "Incorporation Certificate.pdf", status: "uploaded" },
    { id: "2", name: "Form 3 or Form A", file: null, fileName: "Form 3.jpg", status: "uploaded" },
    { id: "3", name: "Ghana Card", file: null, fileName: "", status: "not-uploaded" },
  ]);

  const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setDocuments(
        documents.map((doc) =>
          doc.id === id ? { ...doc, file, fileName: file.name, status: "not-uploaded" } : doc
        )
      );
    }
  };

  const handleUpload = (id: string) => {
    const document = documents.find((doc) => doc.id === id);
    if (!document?.file) {
      toast.error("Please select a file first");
      return;
    }

    // Simulate upload
    setTimeout(() => {
      setDocuments(
        documents.map((doc) =>
          doc.id === id ? { ...doc, status: "uploaded" } : doc
        )
      );
      toast.success(`${document.name} uploaded successfully`);
    }, 1000);
  };

  const handleRemove = (id: string) => {
    setDocuments(
      documents.map((doc) =>
        doc.id === id ? { ...doc, file: null, fileName: "", status: "not-uploaded" } : doc
      )
    );
    // Reset file input
    if (fileInputRefs.current[id]) {
      fileInputRefs.current[id]!.value = "";
    }
    toast.success("File removed");
  };

  const handleView = (id: string) => {
    const document = documents.find((doc) => doc.id === id);
    if (document?.file) {
      // Create object URL for preview
      const url = URL.createObjectURL(document.file);
      window.open(url, "_blank");
      toast.info(`Viewing ${document.name}`);
    } else if (document?.status === "uploaded") {
      toast.info(`Viewing ${document.name}`);
      // In a real app, you'd fetch the file from the server
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if all documents are uploaded
    const allUploaded = documents.every((doc) => doc.status === "uploaded");
    
    if (!allUploaded) {
      toast.error("Please upload all required documents");
      return;
    }

    toast.success("All documents uploaded successfully!");
    router.push("/dashboard/review");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900">
      <DashboardSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Upload Documents
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8">
              {documents.map((document, index) => (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-4"
                >
                  <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {document.name}
                  </Label>

                  {/* File Upload Bar */}
                  <div className="flex items-center gap-4">
                    {/* Horizontal Bar Container */}
                    <div className="flex flex-1 items-center rounded-lg border-2 border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-950 overflow-hidden py-1">
                      {/* Choose File Button (Left) */}
                      <input
                        ref={(el) => { fileInputRefs.current[document.id] = el; }}
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(document.id, e)}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[document.id]?.click()}
                        className="h-20 px-8 rounded-l-lg rounded-r-none bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        Choose File
                      </button>

                      {/* File Name Display (Middle) */}
                      <div className="flex-1 px-4 py-3 justify-center items-center relative left-30">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {document.fileName || "No file chosen"}
                        </span>
                      </div>

                      {/* Upload Button (Right) */}
                      <Button
                        type="button"
                        onClick={() => handleUpload(document.id)}
                        disabled={document.status === "uploaded" || !document.file}
                        className={`h-28 py-8 rounded-l-none rounded-r-lg px-6 ${
                          document.status === "uploaded"
                            ? "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-900"
                            : "bg-[#033783] text-white hover:bg-[#022555]"
                        }`}
                      >
                        Upload
                      </Button>
                    </div>

                    {/* Status Display (Right of bar) */}
                    <div className="flex items-center gap-2 min-w-[200px]">
                      {document.status === "uploaded" ? (
                        <>
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                          <span className="text-sm font-medium text-green-600">
                            Uploaded Successfully
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-6 w-6 text-red-600" />
                          <span className="text-sm font-medium text-red-600">
                            File Not Uploaded
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Remove and View Links (Below bar) */}
                  <div className="flex items-center gap-4 ml-2 justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemove(document.id)}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => handleView(document.id)}
                      disabled={!document.file && document.status !== "uploaded"}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                  </div>
                </motion.div>
              ))}

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <Button
                  type="submit"
                  size="lg"
                  className="bg-[#033783] text-white hover:bg-[#022555]"
                >
                  Next: Review & Submit
                </Button>
              </div>
            </form>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

