"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Building,
  Users,
  Shield,
  ArrowRight
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";

/** Format confidence: backend sends 0–1 decimal (e.g. 0.7) → show as 70%. */
function confidencePercent(confidence: number): number {
  if (typeof confidence !== "number" || Number.isNaN(confidence)) return 0;
  if (confidence > 1) return Math.round(confidence);
  return Math.round(confidence * 100);
}

/** Render markdown-like analysis text: **bold**, numbered lists with spacing, paragraphs. */
function formatAnalysisText(content: string): React.ReactNode {
  if (typeof content !== "string" || !content.trim()) return null;
  // Strip markdown heading hashes so they are never shown in the UI.
  const noHashes = content.replace(/#{1,6}\s+/g, "");
  const lines = noHashes.split(/\r?\n/);
  const out: React.ReactNode[] = [];
  const numberedRegex = /^(\d+)\.\s+(.*)$/;

  function renderLine(line: string, key: string): React.ReactNode {
    const parts: (string | React.ReactNode)[] = [];
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    let lastIndex = 0;
    while ((match = boldRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }
      parts.push(<strong key={`${key}-b-${match.index}`}>{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) parts.push(line.substring(lastIndex));
    return <React.Fragment key={key}>{parts.length > 0 ? parts : line}</React.Fragment>;
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const lineKey = `line-${i}`;
    const trimmed = line.trim();
    const numMatch = trimmed.match(numberedRegex);

    if (trimmed === "") {
      out.push(<div key={lineKey} className="h-2" aria-hidden />);
      i++;
      continue;
    }

    if (numMatch) {
      out.push(
        <div key={lineKey} className="mt-4 first:mt-0">
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            {renderLine(trimmed, lineKey)}
          </div>
          <div className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
            {(() => {
              const bodyLines: React.ReactNode[] = [];
              i++;
              while (i < lines.length && !lines[i].trim().match(numberedRegex)) {
                const bodyLine = lines[i];
                if (bodyLine.trim() === "") {
                  bodyLines.push(<div key={`${lineKey}-body-${i}`} className="h-2" aria-hidden />);
                } else {
                  bodyLines.push(
                    <div key={`${lineKey}-body-${i}`}>
                      {renderLine(bodyLine, `${lineKey}-${i}`)}
                    </div>
                  );
                }
                i++;
              }
              return bodyLines;
            })()}
          </div>
        </div>
      );
      continue;
    }

    const hashHeadingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (hashHeadingMatch) {
      const level = hashHeadingMatch[1].length;
      const title = hashHeadingMatch[2].trim();
      const headingClass =
        level <= 1 ? "text-lg font-semibold mt-4 first:mt-0" :
        level === 2 ? "text-base font-semibold mt-3" :
        "text-sm font-semibold mt-2";
      out.push(
        <div key={lineKey} className={`${headingClass} text-gray-900 dark:text-gray-100`}>
          {renderLine(title, lineKey)}
        </div>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("**") && trimmed.endsWith("**") && trimmed.slice(2, -2).indexOf("**") === -1) {
      out.push(
        <div key={lineKey} className="mt-3 font-semibold text-gray-900 dark:text-gray-100">
          {trimmed.slice(2, -2)}
        </div>
      );
      i++;
      continue;
    }

    out.push(
      <div key={lineKey} className="mt-1 text-sm text-gray-700 dark:text-gray-300">
        {renderLine(line, lineKey)}
      </div>
    );
    i++;
  }

  return <div className="space-y-0.5">{out}</div>;
}

export interface AnalysisResult {
  verdict: 'approve' | 'reject' | 'needs_review';
  confidence: number;
  summary: string;
  /** Brief summary for the Summary collapsible (keep short). */
  briefSummary?: string;
  detailedReport: {
    companyInfo: {
      status: 'complete' | 'incomplete' | 'issues';
      findings: string[];
    };
    directors: {
      status: 'complete' | 'incomplete' | 'issues';
      findings: string[];
    };
    documents: {
      status: 'complete' | 'incomplete' | 'issues';
      findings: string[];
      documentAnalysis: Array<{
        filename: string;
        documentType: string;
        status: 'valid' | 'invalid' | 'needs_review';
        findings: string[];
      }>;
    };
    compliance: {
      status: 'compliant' | 'non_compliant' | 'partial';
      findings: string[];
    };
  };
  recommendations: string[];
}

interface AIAnalysisPanelProps {
  applicationId: string;
  userToken: string;
  /** When the page loads, show stored analysis so we avoid duplicate runs; button becomes "Run new analysis" */
  initialAnalysis?: AnalysisResult | null;
}

export function AIAnalysisPanel({ applicationId, userToken, initialAnalysis }: AIAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));

  // Load stored analysis when details are available (saves tokens; one canonical result per application)
  useEffect(() => {
    setAnalysis(initialAnalysis ?? null);
  }, [applicationId, initialAnalysis]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await adminApi.analyzeApplication(applicationId, userToken);
      if (response.success && response.analysis) {
        setAnalysis(response.analysis);
        toast.success("AI Analysis completed successfully!");
      } else {
        // Use user-friendly error message from API
        const errorMessage = response.error || 'Analysis failed. Please try again.';
        toast.error(errorMessage);
      }
    } catch (error: any) {
      // Error is already logged server-side, just show user-friendly message
      const errorMessage = error?.userMessage || error?.message || 'Failed to analyze application. Please try again.';
      toast.error(errorMessage, {
        description: error?.retryable !== false ? 'You can try again in a moment.' : 'Please contact support if this issue persists.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'approve':
        return 'green';
      case 'reject':
        return 'red';
      case 'needs_review':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getVerdictBorderColor = (verdict: string) => {
    switch (verdict) {
      case 'approve':
        return 'border-green-500/50 bg-green-500/20';
      case 'reject':
        return 'border-red-500/50 bg-red-500/20';
      case 'needs_review':
        return 'border-yellow-500/50 bg-yellow-500/20';
      default:
        return 'border-gray-500/50 bg-gray-500/20';
    }
  };

  const getVerdictBadgeColor = (verdict: string) => {
    switch (verdict) {
      case 'approve':
        return 'bg-green-500';
      case 'reject':
        return 'bg-red-500';
      case 'needs_review':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'approve':
        return <CheckCircle className="h-5 w-5" />;
      case 'reject':
        return <XCircle className="h-5 w-5" />;
      case 'needs_review':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    if (status.includes('complete') || status === 'compliant' || status === 'valid') {
      return 'text-green-600 dark:text-green-400';
    }
    if (status.includes('incomplete') || status === 'non_compliant' || status === 'invalid') {
      return 'text-red-600 dark:text-red-400';
    }
    return 'text-yellow-600 dark:text-yellow-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              AI Application Analysis
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Automated review based on training data
            </p>
          </div>
        </div>
        <Button
          onClick={handleAnalyze}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4" />
              {analysis ? "Run new analysis" : "Run Analysis"}
            </>
          )}
        </Button>
      </div>

      {analysis && (
        <div className="space-y-4 mt-6">
          {/* Verdict Card */}
          <div className={`p-4 rounded-lg border-2 ${getVerdictBorderColor(analysis.verdict)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getVerdictIcon(analysis.verdict)}
                <h3 className="text-lg font-bold capitalize">{analysis.verdict.replace('_', ' ')}</h3>
              </div>
              <Badge className={`${getVerdictBadgeColor(analysis.verdict)} text-white`}>
                {confidencePercent(analysis.confidence)}% Confidence
              </Badge>
            </div>
            <div className="text-gray-700 dark:text-gray-300 mt-2 prose prose-sm dark:prose-invert max-w-none">
              {formatAnalysisText(analysis.summary)}
            </div>
          </div>

          {/* Summary Section */}
          <div className="border rounded-lg">
            <button
              onClick={() => toggleSection('summary')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                <span className="font-semibold">Summary</span>
              </div>
              {expandedSections.has('summary') ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
            {expandedSections.has('summary') && (
              <div className="p-4 pt-0 border-t text-gray-700 dark:text-gray-300">
                {formatAnalysisText(analysis.briefSummary ?? (analysis.summary.length > 320 ? analysis.summary.slice(0, 320).trim().replace(/\s+\S*$/, '') + '…' : analysis.summary))}
              </div>
            )}
          </div>

          {/* Company Info Section */}
          <div className="border rounded-lg">
            <button
              onClick={() => toggleSection('company')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-gray-500" />
                <span className="font-semibold">Company Information</span>
                <Badge variant="outline" className={getStatusColor(analysis.detailedReport.companyInfo.status)}>
                  {analysis.detailedReport.companyInfo.status}
                </Badge>
              </div>
              {expandedSections.has('company') ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
            {expandedSections.has('company') && (
              <div className="p-4 pt-0 border-t">
                <ul className="space-y-3">
                  {analysis.detailedReport.companyInfo.findings.map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-500 mt-1 shrink-0">•</span>
                      <div className="text-gray-700 dark:text-gray-300 min-w-0">{formatAnalysisText(finding)}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Directors Section */}
          <div className="border rounded-lg">
            <button
              onClick={() => toggleSection('directors')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-500" />
                <span className="font-semibold">Directors</span>
                <Badge variant="outline" className={getStatusColor(analysis.detailedReport.directors.status)}>
                  {analysis.detailedReport.directors.status}
                </Badge>
              </div>
              {expandedSections.has('directors') ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
            {expandedSections.has('directors') && (
              <div className="p-4 pt-0 border-t">
                <ul className="space-y-3">
                  {analysis.detailedReport.directors.findings.map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-500 mt-1 shrink-0">•</span>
                      <div className="text-gray-700 dark:text-gray-300 min-w-0">{formatAnalysisText(finding)}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Documents Section */}
          <div className="border rounded-lg">
            <button
              onClick={() => toggleSection('documents')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                <span className="font-semibold">Documents</span>
                <Badge variant="outline" className={getStatusColor(analysis.detailedReport.documents.status)}>
                  {analysis.detailedReport.documents.status}
                </Badge>
              </div>
              {expandedSections.has('documents') ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
            {expandedSections.has('documents') && (
              <div className="p-4 pt-0 border-t space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Overall Findings:</h4>
                  <ul className="space-y-3">
                    {analysis.detailedReport.documents.findings.map((finding, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-blue-500 mt-1 shrink-0">•</span>
                        <div className="text-gray-700 dark:text-gray-300 min-w-0">{formatAnalysisText(finding)}</div>
                      </li>
                    ))}
                  </ul>
                </div>
                {analysis.detailedReport.documents.documentAnalysis.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Individual Document Analysis:</h4>
                    <div className="space-y-3">
                      {analysis.detailedReport.documents.documentAnalysis.map((doc, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{doc.filename}</span>
                            <Badge variant="outline" className={getStatusColor(doc.status)}>
                              {doc.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">{doc.documentType}</p>
                          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                            {doc.findings.map((finding, fIdx) => (
                              <div key={fIdx} className="pl-0">
                                {formatAnalysisText(finding)}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Compliance Section */}
          <div className="border rounded-lg">
            <button
              onClick={() => toggleSection('compliance')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-500" />
                <span className="font-semibold">Compliance</span>
                <Badge variant="outline" className={getStatusColor(analysis.detailedReport.compliance.status)}>
                  {analysis.detailedReport.compliance.status.replace('_', ' ')}
                </Badge>
              </div>
              {expandedSections.has('compliance') ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
            {expandedSections.has('compliance') && (
              <div className="p-4 pt-0 border-t">
                <ul className="space-y-3">
                  {analysis.detailedReport.compliance.findings.map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-500 mt-1 shrink-0">•</span>
                      <div className="text-gray-700 dark:text-gray-300 min-w-0">{formatAnalysisText(finding)}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="border rounded-lg border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <div className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  Recommendations
                </h3>
                <ul className="space-y-3">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="h-5 w-5 text-blue-600" />
                      <div className="text-gray-700 dark:text-gray-300 min-w-0">{formatAnalysisText(rec)}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {!analysis && !loading && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Click "Run Analysis" to get AI-powered insights on this application</p>
          <p className="text-xs mt-2">Analysis compares against training examples from Form 3 documents</p>
        </div>
      )}
    </div>
  );
}
