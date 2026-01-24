"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Document {
  id: number;
  filename: string;
  file_url: string;
  document_type: string;
}

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  initialIndex?: number;
}

export function PDFViewerModal({ 
  isOpen, 
  onClose, 
  documents, 
  initialIndex = 0 
}: PDFViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [pdfUrl, setPdfUrl] = useState<string>("");

  useEffect(() => {
    if (isOpen && documents.length > 0) {
      setCurrentIndex(Math.min(initialIndex, documents.length - 1));
    }
  }, [isOpen, initialIndex, documents.length]);

  useEffect(() => {
    if (isOpen && documents.length > 0 && documents[currentIndex]) {
      const doc = documents[currentIndex];
      let url = doc.file_url;
      
      // Handle URL construction
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        url = url.startsWith('/') ? `${backendUrl}${url}` : `${backendUrl}/${url}`;
      }
      
      setPdfUrl(url);
    }
  }, [currentIndex, documents, isOpen]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < documents.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, documents.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < documents.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, currentIndex, documents.length, onClose]);

  if (!isOpen || documents.length === 0) return null;

  const currentDoc = documents[currentIndex];
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < documents.length - 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full flex flex-col bg-white dark:bg-gray-900"
          >
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {currentDoc.filename}
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  ({currentIndex + 1} of {documents.length})
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 capitalize px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                  {currentDoc.document_type.replace("_", " ")}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="ml-4"
                aria-label="Close viewer"
              >
                <X className="h-5 w-5" />
              </Button>
            </header>

            {/* PDF Viewer Container */}
            <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-gray-100 dark:bg-gray-950">
              {/* Previous Button */}
              <Button
                variant="outline"
                size="lg"
                onClick={handlePrevious}
                disabled={!canGoPrevious}
                className="absolute left-4 z-10 flex items-center gap-2 bg-white dark:bg-gray-800 shadow-lg"
                aria-label="Previous document"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Previous</span>
              </Button>

              {/* PDF Frame */}
              <div className="w-full h-full flex items-center justify-center p-4">
                {pdfUrl ? (
                  <iframe
                    src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                    className="w-full h-full border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg bg-white"
                    title={currentDoc.filename}
                    allow="fullscreen"
                  />
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <p>Loading PDF...</p>
                  </div>
                )}
              </div>

              {/* Next Button */}
              <Button
                variant="outline"
                size="lg"
                onClick={handleNext}
                disabled={!canGoNext}
                className="absolute right-4 z-10 flex items-center gap-2 bg-white dark:bg-gray-800 shadow-lg"
                aria-label="Next document"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Footer Navigation */}
            <footer className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={!canGoPrevious}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous Document</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={!canGoNext}
                    className="flex items-center gap-2"
                  >
                    <span>Next Document</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                >
                  Close
                </Button>
              </div>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
