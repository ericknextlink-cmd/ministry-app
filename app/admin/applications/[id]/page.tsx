"use client";

import { useEffect, useState, useCallback, use } from "react"; // Import use
import { useRouter } from "next/navigation";
import { useApplication } from "@/contexts/ApplicationContext";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { formatApplicationId } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Building, Users, FileText, Mail, Phone, AlertCircle, RefreshCw, Clock } from "lucide-react";
import { AIAnalysisPanel } from "@/components/admin/ai-analysis-panel";
import { PDFViewerModal } from "@/components/admin/pdf-viewer-modal";

// Types matching backend AdminApplicationDetails response
interface CompanyInfo {
    id: number;
    company_name: string;
    registration_number: string;
    address: string;
    city: string;
    country: string;
    phone_number: string;
    email: string;
    application_id: number;
}

interface Director {
    id: number;
    name: string;
    position: string;
    nationality: string;
    phone_number: string;
    email: string;
    application_id: number;
}

interface Document {
    id: number;
    document_type: string;
    filename: string;
    file_url: string;
    uploaded_at: string;
    application_id: number;
}

interface AdminApplicationDetailsType {
    id: number;
    certificate_type: string;
    certificate_class?: string;
    description?: string;
    status: string;
    current_step: number;
    user_id: number;
    created_at: string;
    updated_at: string;
    company_info: CompanyInfo | null;
    directors: Director[];
    documents: Document[];
    assigned_to: number | null;
    reviewer_email: string | null;
}


export default function AdminApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params); // Unwrap params using use()
  const { isAuthenticated, userToken, user } = useApplication();
  const [applicationDetails, setApplicationDetails] = useState<AdminApplicationDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState(0);

  const applicationId = parseInt(id);

  const fetchApplicationDetails = useCallback(async () => {
    const canView = user?.is_superuser || user?.role === 'admin' || user?.role === 'super_admin';
    console.log("Fetching details...", { userToken: !!userToken, canView, role: user?.role, id: applicationId });
    
    if (!userToken || !canView) {
      console.log("Abort: Missing token or permission");
      return;
    }
    
    if (isNaN(applicationId)) {
        toast.error("Invalid Application ID");
        router.push("/admin");
        return;
    }

    setLoading(true);
    try {
      console.log("Calling API...");
      const details = await adminApi.getAdminApplicationDetails<AdminApplicationDetailsType>(applicationId, userToken);
      console.log("API Success:", details);
      setApplicationDetails(details);
    } catch (error: any) {
      // Don't show error toast for session expiration - it's handled globally
      if (!error.message?.includes("Session expired") && !error.message?.includes("401")) {
      console.error("Failed to fetch application details:", error);
      toast.error(error.message || "Failed to load application details.");
      }
      // If 403, redirect to admin list, not auth (401 is handled globally)
      if (error.message?.includes("403")) {
          router.push("/admin");
      }
    } finally {
      console.log("Setting loading false");
      setLoading(false);
    }
  }, [applicationId, userToken, user, router]);

  useEffect(() => {
    const canView = user?.is_superuser || user?.role === 'admin' || user?.role === 'super_admin';
    console.log("Effect triggered:", { isAuthenticated, user, canView });
    if (isAuthenticated && canView && userToken) {
        fetchApplicationDetails();
    } else if (isAuthenticated && user && !canView) {
        console.log("Redirecting non-admin");
        router.push("/dashboard"); // Redirect non-admins
    } else if (!isAuthenticated) {
        router.push("/auth");
    }
  }, [isAuthenticated, user?.role, user?.is_superuser, userToken, applicationId, router]); // Removed fetchApplicationDetails from deps to prevent loops

  const handleAssign = async () => {
      if (!userToken) return;
      setAssigning(true);
      try {
          await adminApi.assignApplication(applicationId, userToken);
          toast.success("Application assigned to you.");
          fetchApplicationDetails();
      } catch (error: any) {
          toast.error(error.message || "Failed to assign application.");
      } finally {
          setAssigning(false);
      }
  };

  const handleUnassign = async () => {
      if (!userToken) return;
      setAssigning(true);
      try {
          await adminApi.unassignApplication(applicationId, userToken);
          toast.success("Application unassigned.");
          fetchApplicationDetails();
      } catch (error: any) {
          toast.error(error.message || "Failed to unassign application.");
      } finally {
          setAssigning(false);
      }
  };

  const handleUpdateStatus = async (newStatus: "approved" | "rejected" | "suspended") => {
    if (!userToken) return;
    setUpdatingStatus(true);
    try {
      await adminApi.updateStatus(applicationId, newStatus, userToken);
      toast.success(`Application ${newStatus} successfully!`);
      fetchApplicationDetails(); // Refresh details
    } catch (error: any) {
      toast.error(error.message || `Failed to ${newStatus} application.`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading application details...</div>;
  }

  if (!applicationDetails) {
    return <div className="p-8 text-center text-red-500">Application details not found or failed to load.</div>;
  }
  
  const getStatusBadgeColor = (status: string) => {
      switch (status) {
          case "approved": return "bg-green-500";
          case "rejected": return "bg-red-500";
          case "suspended": return "bg-orange-500";
          case "submitted":
          case "pending_payment":
          case "in_review": return "bg-yellow-500";
          default: return "bg-gray-500";
      }
  };

  const isAssignedToMe = user && applicationDetails.assigned_to === user.id;
  const isAssignedToOther = applicationDetails.assigned_to && applicationDetails.assigned_to !== user?.id;
  const isUnassigned = !applicationDetails.assigned_to;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Assignment Status Bar */}
      <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-2">
              <span className="font-medium text-blue-900 dark:text-blue-100">Reviewer:</span>
              {isUnassigned ? (
                  <span className="text-gray-500 italic">Unassigned</span>
              ) : (
                  <span className="font-bold text-blue-800 dark:text-blue-200">
                      {isAssignedToMe ? "You" : applicationDetails.reviewer_email || "Another Admin"}
                  </span>
              )}
          </div>
          <div>
              {isUnassigned && (
                  <Button size="sm" onClick={handleAssign} disabled={assigning}>
                      {assigning ? "Assigning..." : "Assign to Me"}
                  </Button>
              )}
              {isAssignedToMe && (
                  <Button size="sm" variant="outline" onClick={handleUnassign} disabled={assigning}>
                      {assigning ? "Unassigning..." : "Unassign"}
                  </Button>
              )}
              {isAssignedToOther && user?.is_superuser && (
                   <Button size="sm" variant="destructive" onClick={handleUnassign} disabled={assigning}>
                      Force Unassign
                   </Button>
              )}
              {isAssignedToOther && !user?.is_superuser && (
                  <span className="text-sm text-gray-500 italic">Locked by reviewer</span>
              )}
          </div>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-4">
          {formatApplicationId(applicationDetails.id, applicationDetails.created_at)} 
          <Badge className={`${getStatusBadgeColor(applicationDetails.status)} text-white capitalize`}>
              {applicationDetails.status.replace("_", " ")}
          </Badge>
      </h1>

      {/* Action Buttons */}
      <div className="flex gap-4 items-center">
        {/* Pre-Submission Status */}
        {(applicationDetails.status === "draft" || applicationDetails.status === "pending_payment") && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 italic">
                <Clock className="h-4 w-4" />
                <span>Awaiting Applicant Submission</span>
            </div>
        )}

        {/* Review Actions (Submitted/In Review) */}
        {(applicationDetails.status === "submitted" || applicationDetails.status === "in_review") && (
            <>
                <Button 
                    onClick={() => handleUpdateStatus("approved")}
                    disabled={updatingStatus || !!isAssignedToOther}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                >
                    <CheckCircle className="h-4 w-4" /> {updatingStatus ? "Approving..." : "Approve"}
                </Button>
                <Button 
                    onClick={() => handleUpdateStatus("rejected")}
                    disabled={updatingStatus || !!isAssignedToOther}
                    className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                >
                    <XCircle className="h-4 w-4" /> {updatingStatus ? "Rejecting..." : "Reject"}
                </Button>
            </>
        )}

        {/* Post-Approval Actions */}
        {applicationDetails.status === "approved" && (
            <Button 
                onClick={() => handleUpdateStatus("suspended")}
                disabled={updatingStatus || !!isAssignedToOther}
                className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
            >
                <AlertCircle className="h-4 w-4" /> {updatingStatus ? "Suspending..." : "Suspend Certificate"}
            </Button>
        )}

        {/* Suspended Actions */}
        {applicationDetails.status === "suspended" && (
            <Button 
                onClick={() => handleUpdateStatus("approved")}
                disabled={updatingStatus || !!isAssignedToOther}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
                <RefreshCw className="h-4 w-4" /> {updatingStatus ? "Reinstating..." : "Reinstate Certificate"}
            </Button>
        )}
      </div>

      {/* AI Analysis Panel */}
      {userToken && (
        <AIAnalysisPanel applicationId={applicationId} userToken={userToken} />
      )}

      {/* Application Details */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><FileText className="h-5 w-5" /> Application Overview</h2>
          <p><strong>Type:</strong> <span className="capitalize">{applicationDetails.certificate_type}</span></p>
          <p><strong>Class:</strong> {applicationDetails.certificate_class || "N/A"}</p>
          <p><strong>Description:</strong> {applicationDetails.description || "No description provided."}</p>
          <p><strong>Created:</strong> {new Date(applicationDetails.created_at).toLocaleString()}</p>
      </div>

      {/* Company Info */}
      {applicationDetails.company_info && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Building className="h-5 w-5" /> Company Information</h2>
              <p><strong>Name:</strong> {applicationDetails.company_info.company_name}</p>
              <p><strong>Reg. No:</strong> {applicationDetails.company_info.registration_number}</p>
              <p><strong>Address:</strong> {applicationDetails.company_info.address}, {applicationDetails.company_info.city}, {applicationDetails.company_info.country}</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {applicationDetails.company_info.email}</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {applicationDetails.company_info.phone_number}</p>
          </div>
      )}

      {/* Directors */}
      {applicationDetails.directors && applicationDetails.directors.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Users className="h-5 w-5" /> Directors</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {applicationDetails.directors.map(director => (
                      <div key={director.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50">
                          <p><strong>Name:</strong> {director.name}</p>
                          <p><strong>Position:</strong> {director.position}</p>
                          <p><strong>Nationality:</strong> {director.nationality}</p>
                          <p className="flex items-center gap-1 text-sm"><Mail className="h-3 w-3" /> {director.email}</p>
                          <p className="flex items-center gap-1 text-sm"><Phone className="h-3 w-3" /> {director.phone_number}</p>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Documents */}
      {applicationDetails.documents && applicationDetails.documents.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><FileText className="h-5 w-5" /> Submitted Documents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {applicationDetails.documents.map(doc => (
                      <div key={doc.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center">
                          <div>
                              <p className="font-medium">{doc.filename}</p>
                              <p className="text-sm text-gray-500 capitalize">{doc.document_type.replace("_", " ")}</p>
                          </div>
                          <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                  const index = applicationDetails.documents.findIndex(d => d.id === doc.id);
                                  setSelectedDocumentIndex(index >= 0 ? index : 0);
                                  setPdfViewerOpen(true);
                              }}
                          >
                              View
                          </Button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* PDF Viewer Modal */}
      {applicationDetails.documents && applicationDetails.documents.length > 0 && (
        <PDFViewerModal
          isOpen={pdfViewerOpen}
          onClose={() => setPdfViewerOpen(false)}
          documents={applicationDetails.documents}
          initialIndex={selectedDocumentIndex}
        />
      )}
    </div>
  );
}