"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApplication } from "@/contexts/ApplicationContext";
import { upgradeCriteriaApi, applicationsApi, type UpgradeCriteriaItem } from "@/lib/api";
import {
  getClassesUpgradeTo,
  getAllClasses,
  CERTIFICATE_CLASS_ORDER,
  type CertificateType,
} from "@/lib/certificate-classes";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Award, ListChecks, Loader2, FileText, Download } from "lucide-react";
import { Application } from "@/lib/types";
import { toast } from "sonner";

const CERT_TYPE_LABELS: Record<string, string> = {
  building: "General Building & Civil Works",
  civil: "General Building & Civil Works",
  electrical: "Electrical Works",
  plumbing: "Plumbing Works",
};

export default function CertificatesPage() {
  const router = useRouter();
  const { isAuthenticated, applications, fetchApplications, userToken } = useApplication();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUpgradeView, setShowUpgradeView] = useState(false);
  const [criteria, setCriteria] = useState<UpgradeCriteriaItem[]>([]);
  const [criteriaLoading, setCriteriaLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
    } else {
      fetchApplications();
    }
  }, [isAuthenticated, router, fetchApplications]);

  useEffect(() => {
    if (!showUpgradeView || !userToken) return;
    setCriteriaLoading(true);
    upgradeCriteriaApi
      .list(userToken)
      .then(setCriteria)
      .catch(() => setCriteria([]))
      .finally(() => setCriteriaLoading(false));
  }, [showUpgradeView, userToken]);

  /** Approved certificates: per type show the valid (non-expired) one when possible, not the expired one. */
  const approvedForCerts = applications.filter((app) => app.status === "approved");
  const typeKey = (app: { certificate_type: string }) =>
    app.certificate_type === "civil" ? "building" : app.certificate_type;
  const certificates = (["building", "electrical", "plumbing"] as const).map((type) => {
    const ofType = approvedForCerts.filter((app) => typeKey(app) === type);
    if (ofType.length === 0) return null;
    const now = new Date();
    const valid = ofType.filter((app) => !app.expiry_date || new Date(app.expiry_date) >= now);
    const toShow = valid.length > 0 ? valid : ofType;
    const byExpiry = [...toShow].sort((a, b) => {
      const aExp = a.expiry_date ? new Date(a.expiry_date).getTime() : 0;
      const bExp = b.expiry_date ? new Date(b.expiry_date).getTime() : 0;
      return bExp - aExp;
    });
    return byExpiry[0] ?? null;
  }).filter(Boolean) as Application[];

  /** Applications that have been paid (step >= 5 after company-before-payment flow). */
  const paidApplications = applications.filter((app) => app.current_step >= 5);
  const [invoiceDownloadingId, setInvoiceDownloadingId] = useState<string | null>(null);

  const handleDownloadInvoice = async (applicationId: string) => {
    if (!userToken) return;
    setInvoiceDownloadingId(applicationId);
    try {
      const { blob, filename } = await applicationsApi.getInvoiceBlob(applicationId, userToken);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Invoice downloaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to download invoice.");
    } finally {
      setInvoiceDownloadingId(null);
    }
  };

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900">
      <DashboardSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div
        className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}
      >
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Certificates
              </h1>
              <Button
                variant={showUpgradeView ? "secondary" : "default"}
                className="bg-[#033783] hover:bg-[#022555] text-white"
                onClick={() => setShowUpgradeView(!showUpgradeView)}
              >
                <ListChecks className="h-4 w-4 mr-2" />
                {showUpgradeView ? "Back to certificate list" : "Check class upgrade eligibility"}
              </Button>
            </div>

            {!showUpgradeView ? (
              <>
                {/* Payment invoices: paid applications — easy access to invoices */}
                {paidApplications.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#033783]" />
                      Payment invoices
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Download invoices for applications you have paid. Invoices are generated after payment and can be re-downloaded here.
                    </p>
                    <ul className="space-y-3">
                      {paidApplications.map((app) => (
                        <li
                          key={app.id}
                          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-[#033783]" />
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                                {CERT_TYPE_LABELS[app.certificate_type] ?? app.certificate_type}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {app.certificate_class ? `Class ${app.certificate_class}` : "—"} · Application {app.id.slice(0, 8)}…
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#033783] text-[#033783] hover:bg-[#033783]/10"
                            onClick={() => handleDownloadInvoice(app.id)}
                            disabled={invoiceDownloadingId === app.id}
                          >
                            {invoiceDownloadingId === app.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Download className="h-4 w-4 mr-2" />
                            )}
                            Download invoice
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mt-8">
                  <Award className="h-5 w-5 text-[#033783]" />
                  Your certificates
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your approved certificates and their classes and expiry dates.
                </p>
                {certificates.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center text-gray-500">
                    No certificates yet. Approved applications will appear here.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {certificates.map((app) => (
                      <li
                        key={app.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <Award className="h-8 w-8 text-[#033783]" />
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                              {CERT_TYPE_LABELS[app.certificate_type] ?? app.certificate_type}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Class {app.certificate_class ?? "—"} · Expires{" "}
                              {app.expiry_date
                                ? new Date(app.expiry_date).toLocaleDateString()
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  By application type and class: expand to see items required to upgrade and which classes you can upgrade to based on your current certificates.
                </p>
                {criteriaLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(Object.keys(CERTIFICATE_CLASS_ORDER) as CertificateType[]).map((certType) => {
                      const classes = getAllClasses(certType);
                      const typeLabel = CERT_TYPE_LABELS[certType] ?? certType;
                      return classes.map((cls) => {
                        const key = `${certType}-${cls}`;
                        const isExpanded = expandedKeys.has(key);
                        const upgradeTo = getClassesUpgradeTo(certType, cls);
                        return (
                          <div
                            key={key}
                            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
                          >
                            <button
                              type="button"
                              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                              onClick={() => toggleExpand(key)}
                            >
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {typeLabel} — Class {cls}
                              </span>
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 shrink-0" />
                              ) : (
                                <ChevronRight className="h-5 w-5 shrink-0" />
                              )}
                            </button>
                            {isExpanded && (
                              <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
                                {criteria.length > 0 ? (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                      Things to consider for upgrade
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                      {criteria.map((item) => (
                                        <li key={item.id}>{item.text}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    No upgrade criteria have been added yet. The ministry will publish a list here.
                                  </p>
                                )}
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                    You can upgrade to
                                  </p>
                                  {upgradeTo.length > 0 ? (
                                    <p className="text-sm font-medium text-[#033783] dark:text-blue-400">
                                      {upgradeTo.join(", ")}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      You are at the highest class for this type.
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
