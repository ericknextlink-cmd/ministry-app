"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Eye, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DocumentFile {
  id: string;
  name: string;
  file: File | null;
  status: "uploaded" | "not-uploaded";
}

export default function DocumentsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [documents, setDocuments] = useState<DocumentFile[]>([
    { id: "1", name: "Incorporation Certificate", file: null, status: "not-uploaded" },
    { id: "2", name: "Form 3 or Form A", file: null, status: "not-uploaded" },
    { id: "3", name: "Ghana Card", file: null, status: "not-uploaded" },
  ]);

  const handleFileChange = (id: string, file: File | null) => {
    setDocuments(
      documents.map((doc) =>
        doc.id === id ? { ...doc, file, status: file ? "not-uploaded" : "not-uploaded" } : doc
      )
    );
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
        doc.id === id ? { ...doc, file: null, status: "not-uploaded" } : doc
      )
    );
    toast.success("File removed");
  };

  const handleView = (id: string) => {
    const document = documents.find((doc) => doc.id === id);
    if (document?.file) {
      toast.info(`Viewing ${document.name}`);
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

  const handleInputFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      handleFileChange(id, file);
    }
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
          <div className="max-w-4xl mx-auto">
            <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-gray-100">
              Upload Documents
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8">
              {documents.map((document, index) => (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-4 rounded-lg border bg-white p-6 dark:bg-gray-950"
                >
                  <Label className="text-lg font-semibold">{document.name}</Label>
                  
                  {/* Upload Area */}
                  <div className="flex items-center gap-4">
                    {/* Choose File Button */}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleInputFileChange(document.id, e)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Choose File
                      </Button>
                    </label>

                    {/* File Name Display */}
                    <div className="flex-1 rounded-md border bg-gray-50 px-4 py-3 dark:bg-gray-900">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {document.file ? document.file.name : `No file chosen`}
                      </span>
                    </div>

                    {/* Upload Button */}
                    <Button
                      type="button"
                      variant={document.status === "uploaded" ? "outline" : "default"}
                      onClick={() => handleUpload(document.id)}
                      disabled={document.status === "uploaded" || !document.file}
                      className={
                        document.status === "uploaded"
                          ? "border-green-600 text-green-600 hover:bg-green-50"
                          : ""
                      }
                    >
                      Upload
                    </Button>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      {document.status === "uploaded" ? (
                        <span className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle2 className="h-5 w-5" />
                          Uploaded Successfully
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-sm text-red-600">
                          <XCircle className="h-5 w-5" />
                          File Not Uploaded
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {(document.file || document.status === "uploaded") && (
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(document.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                      {document.status === "uploaded" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(document.id)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}

              <div className="flex justify-end gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="px-8"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="rounded-full bg-blue-600 px-12 text-white hover:bg-blue-700"
                >
                  Next: Review & Submit
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

