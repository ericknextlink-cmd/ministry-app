"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

interface DirectorInfo {
  id: string;
  surname: string;
  firstName: string;
  nationality: string;
  contact: string;
  tinNumber: string;
  postalAddress: string;
  shares: string;
  emailAddress: string;
}

export default function DirectorsInformationPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [directors, setDirectors] = useState<DirectorInfo[]>([
    { id: "1", surname: "", firstName: "", nationality: "", contact: "", tinNumber: "", postalAddress: "", shares: "", emailAddress: "" },
  ]);

  const handleAddDirector = () => {
    setDirectors([
      ...directors,
      { id: Date.now().toString(), surname: "", firstName: "", nationality: "", contact: "", tinNumber: "", postalAddress: "", shares: "", emailAddress: "" },
    ]);
    toast.success("Director added");
  };

  const handleRemoveDirector = (id: string) => {
    if (directors.length > 1) {
      setDirectors(directors.filter((dir) => dir.id !== id));
      toast.success("Director removed");
    } else {
      toast.error("At least one director is required");
    }
  };

  const handleDirectorChange = (id: string, field: keyof DirectorInfo, value: string) => {
    setDirectors(
      directors.map((dir) => (dir.id === id ? { ...dir, [field]: value } : dir))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Directors information saved!");
    router.push("/dashboard/documents");
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
              Director(s) Information
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8">
              <AnimatePresence mode="wait">
                {directors.map((director, index) => (
                  <motion.div
                    key={director.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="rounded-lg border bg-gray-50 p-6 dark:bg-gray-950"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Director {index + 1}
                      </h2>
                      {directors.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveDirector(director.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {/* Left Column */}
                      <div className="space-y-6">
                        <div>
                          <Label htmlFor={`surname-${director.id}`}>Surname/Other Name</Label>
                          <Input
                            id={`surname-${director.id}`}
                            value={director.surname}
                            onChange={(e) =>
                              handleDirectorChange(director.id, "surname", e.target.value)
                            }
                            className="h-12"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor={`nationality-${director.id}`}>Nationality</Label>
                          <Select
                            value={director.nationality}
                            onValueChange={(value) =>
                              handleDirectorChange(director.id, "nationality", value)
                            }
                          >
                            <SelectTrigger className="h-12 w-full">
                              <SelectValue placeholder="Select nationality" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ghanaian">Ghanaian</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor={`contact-${director.id}`}>Contact</Label>
                          <Input
                            id={`contact-${director.id}`}
                            type="tel"
                            value={director.contact}
                            onChange={(e) =>
                              handleDirectorChange(director.id, "contact", e.target.value)
                            }
                            className="h-12"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor={`tinNumber-${director.id}`}>TIN Number</Label>
                          <Input
                            id={`tinNumber-${director.id}`}
                            value={director.tinNumber}
                            onChange={(e) =>
                              handleDirectorChange(director.id, "tinNumber", e.target.value)
                            }
                            className="h-12"
                            required
                          />
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-6">
                        <div>
                          <Label htmlFor={`firstName-${director.id}`}>First Name</Label>
                          <Input
                            id={`firstName-${director.id}`}
                            value={director.firstName}
                            onChange={(e) =>
                              handleDirectorChange(director.id, "firstName", e.target.value)
                            }
                            className="h-12"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor={`postalAddress-${director.id}`}>Postal Address</Label>
                          <Input
                            id={`postalAddress-${director.id}`}
                            value={director.postalAddress}
                            onChange={(e) =>
                              handleDirectorChange(director.id, "postalAddress", e.target.value)
                            }
                            className="h-12"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor={`shares-${director.id}`}>
                            No. of shares if shareholder
                          </Label>
                          <Input
                            id={`shares-${director.id}`}
                            type="number"
                            value={director.shares}
                            onChange={(e) =>
                              handleDirectorChange(director.id, "shares", e.target.value)
                            }
                            className="h-12"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`emailAddress-${director.id}`}>Email Address</Label>
                          <Input
                            id={`emailAddress-${director.id}`}
                            type="email"
                            value={director.emailAddress}
                            onChange={(e) =>
                              handleDirectorChange(director.id, "emailAddress", e.target.value)
                            }
                            className="h-12"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <Button
                type="button"
                variant="outline"
                onClick={handleAddDirector}
                className="w-full border-dashed"
              >
                <Plus className="mr-2 h-5 w-5" />
                Add Director
              </Button>

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
                  Next: Upload Documents
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

