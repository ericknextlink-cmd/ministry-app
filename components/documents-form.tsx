"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useApplication } from "@/contexts/ApplicationContext";
import { toast } from "sonner";
import { ApplicationType } from "./application-card";
import { CheckCircle, FileText, Upload, X } from "lucide-react";

interface DocumentsFormProps {
  application: ApplicationType;
  onSuccess: () => void;
}

interface Document {
  id: number;
  document_type: string;
  filename: string;
  uploaded_at: string;
}

const REQUIRED_DOCUMENTS = [
  { type: "incorporation_cert", label: "Certificate of Incorporation" },
  { type: "commencement_cert", label: "Certificate to Commence Business" },
  { type: "tax_clearance", label: "Tax Clearance Certificate" },
  { type: "ssnit_clearance", label: "SSNIT Clearance Certificate" },
];

export function DocumentsForm({ application, onSuccess }: DocumentsFormProps) {
  const { uploadDocument, getDocuments, removeDocument, updateApplication } = useApplication();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingMap, setUploadingMap] = useState<Record<string, boolean>>({});

  // Load existing documents
  useEffect(() => {
    loadDocuments();
  }, [application.id]);

  const loadDocuments = async () => {
    const data = await getDocuments(application.id);
    setDocuments(data);
  };

  const handleFileChange = async (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingMap(prev => ({ ...prev, [type]: true }));
      
      try {
        await uploadDocument(application.id, type, file);
        toast.success(`${file.name} uploaded`);
        loadDocuments();
      } catch (err: any) {
        toast.error(err.message || "Upload failed");
      } finally {
        setUploadingMap(prev => ({ ...prev, [type]: false }));
      }
    }
  };

  const handleDelete = async (id: number) => {
      try {
          await removeDocument(id);
          toast.success("Document removed");
          loadDocuments();
      } catch (err: any) {
          toast.error("Failed to remove document");
      }
  };

  const handleSubmit = async () => {
    // Check if all required docs are present
    const missing = REQUIRED_DOCUMENTS.filter(req => !documents.find(d => d.document_type === req.type));
    if (missing.length > 0) {
        toast.error(`Missing documents: ${missing.map(m => m.label).join(", ")}`);
        return;
    }

    setLoading(true);
    try {
      // Final Submission!
      await updateApplication(application.id, {
          current_step: 7, // 7 = Review/Done
          status: "submitted" // Change status to submitted
      });
      toast.success("Application Submitted Successfully!");
      onSuccess();
    } catch (error: any) {
      toast.error("Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-3xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Upload Documents</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Please upload scanned copies of the following official documents.
        </p>
      </div>

      <div className="space-y-6 mb-8">
          {REQUIRED_DOCUMENTS.map((reqDoc) => {
              const uploadedDoc = documents.find(d => d.document_type === reqDoc.type);
              const isUploading = uploadingMap[reqDoc.type];

              return (
                  <div key={reqDoc.type} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                          <Label className="text-base font-medium">{reqDoc.label}</Label>
                          {uploadedDoc && (
                              <span className="text-green-600 flex items-center gap-1 text-sm font-medium">
                                  <CheckCircle className="h-4 w-4" /> Uploaded
                              </span>
                          )}
                      </div>
                      
                      {uploadedDoc ? (
                          <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-3 rounded border border-green-200 dark:border-green-900/30">
                              <div className="flex items-center gap-3 overflow-hidden">
                                  <FileText className="h-8 w-8 text-blue-500 shrink-0" />
                                  <span className="text-sm truncate">{uploadedDoc.filename}</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDelete(uploadedDoc.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                  <X className="h-4 w-4" />
                              </Button>
                          </div>
                      ) : (
                          <div className="mt-2">
                              <input
                                  type="file"
                                  id={`file-${reqDoc.type}`}
                                  className="hidden"
                                  onChange={(e) => handleFileChange(reqDoc.type, e)}
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  disabled={isUploading}
                              />
                              <label 
                                htmlFor={`file-${reqDoc.type}`}
                                className={`flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                                    isUploading 
                                    ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed" 
                                    : "border-gray-300 hover:border-blue-500 hover:bg-blue-50/50 dark:border-gray-600 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                                }`}
                              >
                                  {isUploading ? (
                                      <span>Uploading...</span>
                                  ) : (
                                      <>
                                          <Upload className="h-5 w-5 text-gray-500" />
                                          <span className="text-sm text-gray-600 dark:text-gray-300">Click to upload file (PDF, JPG, PNG)</span>
                                      </>
                                  )}
                              </label>
                          </div>
                      )}
                  </div>
              );
          })}
      </div>

      <div className="flex justify-end pt-2 border-t dark:border-gray-800">
        <Button
          onClick={handleSubmit}
          className="bg-[#033783] text-white hover:bg-[#022555] px-8"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit Application"}
        </Button>
      </div>
    </motion.div>
  );
}
