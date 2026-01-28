"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApplication } from "@/contexts/ApplicationContext";
import { applicationsApi } from "@/lib/api";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Building2, 
  Users, 
  FileText, 
  CheckCircle, 
  Edit, 
  Loader2,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileCheck
} from "lucide-react";
import Link from "next/link";

interface ApplicationDetails {
  id: number;
  certificate_type: string;
  certificate_class: string | null;
  description: string | null;
  status: string;
  current_step: number;
  created_at: string;
  updated_at: string;
  company_info: {
    company_name: string;
    registration_number: string;
    address: string;
    city: string;
    country: string;
    phone_number: string;
    email: string;
  } | null;
  directors: Array<{
    name: string;
    position: string;
    nationality: string;
    phone_number: string;
    email: string;
  }>;
  documents: Array<{
    id: number;
    document_type: string;
    filename: string;
    file_url: string;
    uploaded_at: string;
  }>;
}

export default function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, userToken, fetchApplications } = useApplication();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [details, setDetails] = useState<ApplicationDetails | null>(null);

  const applicationId = searchParams.get("id");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    if (!applicationId) {
      router.push("/dashboard");
      return;
    }
    loadDetails();
  }, [isAuthenticated, applicationId, router]);

  const loadDetails = async () => {
    if (!userToken || !applicationId) return;
    setLoading(true);
    try {
      const data = await applicationsApi.getDetails<ApplicationDetails>(
        parseInt(applicationId),
        userToken
      );
      setDetails(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load application details");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!userToken || !applicationId) return;
    setSubmitting(true);
    try {
      await applicationsApi.submit(parseInt(applicationId), userToken);
      toast.success("Application submitted successfully!");
      await fetchApplications();
      router.push("/dashboard/review?submitted=true");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
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
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#033783]" />
          </main>
        </div>
      </div>
    );
  }

  if (!details) {
    return null;
  }

  const isSubmitted = searchParams.get("submitted") === "true";

  if (isSubmitted) {
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
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center border border-gray-100 dark:border-gray-700">
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Application Submitted!</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                Your application has been successfully submitted to the Ministry. We will review your documents and get back to you shortly.
              </p>
              <Button 
                onClick={() => router.push("/dashboard")}
                className="w-full bg-[#033783] hover:bg-[#022555] h-12 text-base"
              >
                Return to Dashboard
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const canSubmit = details.status === "draft" && 
                    details.company_info && 
                    details.directors.length > 0 && 
                    details.documents.length >= 4;

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

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Review Application</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Please review all information before final submission
                </p>
              </div>
            </div>

            {/* Application Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Application Summary</CardTitle>
                <CardDescription>Certificate type and class</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Certificate Type:</span>
                  <span className="font-medium capitalize">{details.certificate_type.replace('_', ' ')}</span>
                </div>
                {details.certificate_class && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Certificate Class:</span>
                    <span className="font-medium">{details.certificate_class}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
                <CardDescription>Registered company details</CardDescription>
              </CardHeader>
              <CardContent>
                {details.company_info ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Company Name</p>
                        <p className="font-medium">{details.company_info.company_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Registration Number</p>
                        <p className="font-medium">{details.company_info.registration_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                        <p className="font-medium flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {details.company_info.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                        <p className="font-medium flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {details.company_info.phone_number}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                        <p className="font-medium flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {details.company_info.address}, {details.company_info.city}, {details.company_info.country}
                        </p>
                      </div>
                    </div>
                    <Link href={`/dashboard/company?id=${details.id}`}>
                      <Button variant="outline" size="sm" className="mt-2">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Company Information
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>Company information not provided</p>
                    <Link href={`/dashboard/company?id=${details.id}`}>
                      <Button variant="outline" size="sm" className="mt-2">
                        Add Company Information
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Directors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Directors ({details.directors.length})
                </CardTitle>
                <CardDescription>Company directors and key personnel</CardDescription>
              </CardHeader>
              <CardContent>
                {details.directors.length > 0 ? (
                  <div className="space-y-4">
                    {details.directors.map((director, idx) => (
                      <div key={idx} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                            <p className="font-medium">{director.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Position</p>
                            <p className="font-medium">{director.position}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Nationality</p>
                            <p className="font-medium">{director.nationality}</p>
                          </div>
                          {director.email && (
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                              <p className="font-medium">{director.email}</p>
                            </div>
                          )}
                          {director.phone_number && (
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                              <p className="font-medium">{director.phone_number}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <Link href={`/dashboard/directors?id=${details.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Directors
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No directors added</p>
                    <Link href={`/dashboard/directors?id=${details.id}`}>
                      <Button variant="outline" size="sm" className="mt-2">
                        Add Directors
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents ({details.documents.length})
                </CardTitle>
                <CardDescription>Uploaded supporting documents</CardDescription>
              </CardHeader>
              <CardContent>
                {details.documents.length > 0 ? (
                  <div className="space-y-3">
                    {details.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center gap-3">
                          <FileCheck className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium">{doc.filename}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                              {doc.document_type.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm"
                        >
                          View
                        </a>
                      </div>
                    ))}
                    <Link href={`/dashboard/documents?id=${details.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Documents
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No documents uploaded</p>
                    <Link href={`/dashboard/documents?id=${details.id}`}>
                      <Button variant="outline" size="sm" className="mt-2">
                        Upload Documents
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Final Submission */}
            <Card className="border-2 border-blue-200 dark:border-blue-900">
              <CardHeader>
                <CardTitle>Ready to Submit?</CardTitle>
                <CardDescription>
                  Review all information above. Once submitted, you cannot edit this application.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!canSubmit && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Please complete all required sections before submitting.
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button
                    onClick={handleFinalSubmit}
                    disabled={!canSubmit || submitting || details.status !== "draft"}
                    className="flex-1 bg-[#033783] hover:bg-[#022555] text-white"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
