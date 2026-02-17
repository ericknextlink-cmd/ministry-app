"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useApplication } from "@/contexts/ApplicationContext";
import { toast } from "sonner";
import { Application } from "@/lib/types";
import { CheckCircle, FileText, Upload, X, Eye, Loader2 } from "lucide-react";
import { z } from "zod";

interface DocumentsFormProps {
  application: Application;
  onSuccess: () => void;
}

interface Document {
  id: number;
  document_type: string;
  filename: string;
  file_url: string;
  uploaded_at: string;
}

const REQUIRED_DOCUMENTS = [
  { type: "incorporation_cert", label: "Certificate of Incorporation" },
  { type: "commencement_cert", label: "Certificate to Commence Business" },
  { type: "tax_clearance", label: "Tax Clearance Certificate" },
  { type: "ssnit_clearance", label: "SSNIT Clearance Certificate" },
] as const;

/** Zod schema: each required document type must be provided (uploaded or pending file). */
const documentsFormSchema = z.object({
  incorporation_cert: z.boolean().refine((v: boolean) => v === true, {
    message: "Certificate of Incorporation is required",
  }),
  commencement_cert: z.boolean().refine((v: boolean) => v === true, {
    message: "Certificate to Commence Business is required",
  }),
  tax_clearance: z.boolean().refine((v: boolean) => v === true, {
    message: "Tax Clearance Certificate is required",
  }),
  ssnit_clearance: z.boolean().refine((v: boolean) => v === true, {
    message: "SSNIT Clearance Certificate is required",
  }),
});

type DocumentsFormValues = z.infer<typeof documentsFormSchema>;

function buildFormValues(
  documents: Document[],
  pendingFiles: Record<string, File | null>
): Record<keyof DocumentsFormValues, boolean> {
  return {
    incorporation_cert: !!documents.find((d) => d.document_type === "incorporation_cert") || !!pendingFiles.incorporation_cert,
    commencement_cert: !!documents.find((d) => d.document_type === "commencement_cert") || !!pendingFiles.commencement_cert,
    tax_clearance: !!documents.find((d) => d.document_type === "tax_clearance") || !!pendingFiles.tax_clearance,
    ssnit_clearance: !!documents.find((d) => d.document_type === "ssnit_clearance") || !!pendingFiles.ssnit_clearance,
  };
}

export function DocumentsForm({ application, onSuccess }: DocumentsFormProps) {
  const { uploadDocument, getDocuments, removeDocument, updateApplication } = useApplication();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  /** After initial load, if no docs we show "Load documents"; once user clicks it we set this so button becomes "Proceed to Review" */
  const [hasTriedLoadingDocuments, setHasTriedLoadingDocuments] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [pendingFiles, setPendingFiles] = useState<Record<string, File | null>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<{ url: string; filename: string } | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const appId = application.id;

  useEffect(() => {
    loadDocuments();
  }, [appId]);

  const loadDocuments = async () => {
    setDocumentsLoading(true);
    try {
      const data = await getDocuments(appId);
      setDocuments(data);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleLoadDocuments = async () => {
    setDocumentsLoading(true);
    try {
      const data = await getDocuments(appId);
      setDocuments(data);
      setHasTriedLoadingDocuments(true);
      if (data.length > 0) {
        toast.success("Documents loaded.");
      } else {
        toast.info("No documents from previous applications. Please upload the required documents below, then click Proceed to Review.");
      }
    } catch {
      toast.error("Failed to load documents.");
      setHasTriedLoadingDocuments(true);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleFileSelect = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPendingFiles((prev) => ({ ...prev, [type]: e.target.files![0] }));
      setFieldErrors((prev) => ({ ...prev, [type]: "" }));
    }
  };

  const clearPending = (type: string) => {
    setPendingFiles((prev) => ({ ...prev, [type]: null }));
    const input = fileInputRefs.current[type];
    if (input) input.value = "";
  };

  const handleDelete = async (id: number) => {
    setRemovingId(id);
    try {
      await removeDocument(id);
      toast.success("Document removed");
      await loadDocuments();
    } catch {
      toast.error("Failed to remove document");
    } finally {
      setRemovingId(null);
    }
  };

  const handleSubmit = async () => {
    setFieldErrors({});
    const values = buildFormValues(documents, pendingFiles);
    const result = documentsFormSchema.safeParse(values);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err: z.ZodIssue) => {
        const path = err.path[0] as string;
        if (path && err.message) errors[path] = err.message;
      });
      setFieldErrors(errors);
      const first = REQUIRED_DOCUMENTS.find((r) => errors[r.type]);
      toast.error(first ? errors[first.type] : "Please provide all required documents.");
      return;
    }

    setLoading(true);
    try {
      // Upload any pending file for each type (new or replace)
      for (const req of REQUIRED_DOCUMENTS) {
        const file = pendingFiles[req.type];
        if (file) {
          await uploadDocument(appId, req.type, file);
        }
      }
      // Reload so we have latest list (in case of replace)
      await loadDocuments();
      await updateApplication(appId, { current_step: 7 });
      toast.success("All documents uploaded! Proceeding to review...");
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-3xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 relative"
    >
      {documentsLoading && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-white/90 dark:bg-gray-900/90"
          aria-busy="true"
          aria-label="Loading documents"
        >
          <Loader2 className="h-10 w-10 animate-spin text-[#033783]" />
          <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">
            Loading documents...
          </p>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Upload Documents</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select a file for each document below. You can change your selection before proceeding.
          All documents are uploaded when you click &quot;Proceed to Review&quot;.
        </p>
      </div>

      <div className="space-y-6 mb-8">
        {REQUIRED_DOCUMENTS.map((reqDoc) => {
          const uploadedDoc = documents.find((d) => d.document_type === reqDoc.type);
          const pendingFile = pendingFiles[reqDoc.type];
          const error = fieldErrors[reqDoc.type];
          const isRemoving = removingId === uploadedDoc?.id;

          return (
            <div
              key={reqDoc.type}
              className={`p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 ${
                error ? "border-red-300 dark:border-red-800" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-medium">{reqDoc.label}</Label>
                {uploadedDoc && !pendingFile && (
                  <span className="text-green-600 flex items-center gap-1 text-sm font-medium">
                    <CheckCircle className="h-4 w-4" /> Uploaded
                  </span>
                )}
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>
              )}

              {uploadedDoc && !pendingFile ? (
                <div className="flex items-center justify-between gap-2 flex-wrap bg-white dark:bg-gray-900 p-3 rounded border border-green-200 dark:border-green-900/30">
                  <div className="flex items-center gap-3 overflow-hidden min-w-0">
                    <FileText className="h-8 w-8 text-blue-500 shrink-0" />
                    <span className="text-sm truncate">{uploadedDoc.filename}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const url = (uploadedDoc.file_url || "").trim();
                        if (url) setPreview({ url, filename: uploadedDoc.filename });
                        else toast.error("Preview not available for this document.");
                      }}
                      className="text-gray-600 hover:text-blue-600"
                      title="Preview"
                      disabled={isRemoving}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <input
                      type="file"
                      ref={(el) => { fileInputRefs.current[reqDoc.type] = el; }}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileSelect(reqDoc.type, e)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRefs.current[reqDoc.type]?.click()}
                      disabled={isRemoving}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Replace
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(uploadedDoc.id)}
                      disabled={isRemoving}
                      className="text-red-500 hover:text-red-700"
                      title="Remove"
                    >
                      {isRemoving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  <input
                    type="file"
                    id={`file-${reqDoc.type}`}
                    ref={(el) => { fileInputRefs.current[reqDoc.type] = el; }}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileSelect(reqDoc.type, e)}
                  />
                  {!pendingFile ? (
                    <label
                      htmlFor={`file-${reqDoc.type}`}
                      className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-gray-300 hover:border-blue-500 hover:bg-blue-50/50 dark:border-gray-600 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                    >
                      <Upload className="h-5 w-5 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Select file (PDF, JPG, PNG)
                      </span>
                    </label>
                  ) : (
                    <div className="flex items-center justify-between gap-2 p-3 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-5 w-5 text-gray-500 shrink-0" />
                        <span className="text-sm truncate">{pendingFile.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setPreview({
                              url: URL.createObjectURL(pendingFile),
                              filename: pendingFile.name,
                            })
                          }
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearPending(reqDoc.type)}
                        >
                          Change file
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-2 border-t dark:border-gray-800">
        {documents.length > 0 ? (
          <Button
            onClick={handleSubmit}
            className="bg-[#033783] text-white hover:bg-[#022555] px-8"
            disabled={loading || documentsLoading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading & proceeding...
              </>
            ) : (
              "Proceed to Review"
            )}
          </Button>
        ) : !hasTriedLoadingDocuments ? (
          <Button
            onClick={handleLoadDocuments}
            className="bg-[#033783] text-white hover:bg-[#022555] px-8"
            disabled={documentsLoading}
          >
            {documentsLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              "Load documents"
            )}
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            className="bg-[#033783] text-white hover:bg-[#022555] px-8"
            disabled={loading || documentsLoading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading & proceeding...
              </>
            ) : (
              "Proceed to Review"
            )}
          </Button>
        )}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => {
            if (preview.url.startsWith("blob:")) URL.revokeObjectURL(preview.url);
            setPreview(null);
          }}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b dark:border-gray-700">
              <span className="text-sm font-medium truncate">{preview.filename}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (preview.url.startsWith("blob:")) URL.revokeObjectURL(preview.url);
                  setPreview(null);
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 min-h-0 p-2">
              {preview.url ? (
                <iframe
                  src={preview.url}
                  title={preview.filename}
                  className="w-full h-full min-h-[70vh] rounded border-0"
                />
              ) : (
                <div className="flex min-h-[70vh] items-center justify-center text-gray-500 dark:text-gray-400">
                  Preview not available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
