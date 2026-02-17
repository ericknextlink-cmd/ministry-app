"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApplication } from "@/contexts/ApplicationContext";
import { toast } from "sonner";
import { Application } from "@/lib/types";
import { Trash2, UserPlus, Loader2 } from "lucide-react";

interface DirectorsFormProps {
  application: Application;
  onSuccess: () => void;
}

interface Director {
  id: number;
  name: string;
  position: string;
  nationality: string;
  phone_number: string;
  email: string;
}

export function DirectorsForm({ application, onSuccess }: DirectorsFormProps) {
  const { addDirector, getDirectors, getLatestDirectors, removeDirector, updateApplication } = useApplication();
  const [directors, setDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // New Director Form State
  const [newDirector, setNewDirector] = useState({
    name: "",
    position: "",
    nationality: "Ghanaian",
    phone_number: "",
    email: "",
  });

  // Load existing directors
  useEffect(() => {
    loadDirectors();
  }, [application.id]);

  const dedupeById = (list: Director[]) =>
    Array.from(new Map(list.map((d) => [d.id, d])).values());

  const loadDirectors = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
        const data = await getDirectors(application.id);
        const unique = dedupeById(data);

        // If current app is empty, check for latest from previous apps
        if (unique.length === 0 && !silent) {
            const latestData = await getLatestDirectors();
            if (latestData && latestData.length > 0) {
                // Auto-import them
                for (const d of latestData) {
                    await addDirector(application.id, {
                        name: d.name,
                        position: d.position,
                        nationality: d.nationality,
                        phone_number: d.phone_number,
                        email: d.email
                    });
                }
                toast.info("Directors information from your previous application has been auto-filled.");
                const refreshed = await getDirectors(application.id);
                setDirectors(dedupeById(refreshed));
            } else {
                setDirectors([]);
            }
        } else {
            setDirectors(unique);
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (!silent) setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewDirector((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddDirector = async () => {
    if (!newDirector.name || !newDirector.position) {
        toast.error("Name and Position are required");
        return;
    }
    
    setAdding(true);
    try {
        await addDirector(application.id, newDirector);
        toast.success("Director added");
        setNewDirector({
            name: "",
            position: "",
            nationality: "Ghanaian",
            phone_number: "",
            email: "",
        }); // Reset form
        loadDirectors(true); // Silent reload
    } catch (err: any) {
        toast.error(err.message || "Failed to add director");
    } finally {
        setAdding(false);
    }
  };

  const handleDeleteDirector = async (id: number) => {
      try {
          await removeDirector(id);
          toast.success("Director removed");
          loadDirectors(true); // Silent reload
      } catch (err: any) {
          toast.error("Failed to remove director");
      }
  };

  const handleContinue = async () => {
    if (directors.length === 0) {
        toast.error("Please add at least one director.");
        return;
    }

    setLoading(true);
    try {
      // Update Application Step
      await updateApplication(application.id, {
          current_step: 6, // 6 = Upload Docs
      });
      onSuccess();
    } catch (error: any) {
      toast.error("Failed to update application");
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Directors / Management</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Add details of the company's directors or key management personnel.
        </p>
      </div>

      {/* List of Added Directors */}
      <div className="space-y-4 mb-8">
          {directors.length > 0 ? (
              directors.map((director) => (
                  <div key={director.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                      <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{director.name}</h4>
                          <p className="text-sm text-gray-500">{director.position} • {director.nationality}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteDirector(director.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                          <Trash2 className="h-4 w-4" />
                      </Button>
                  </div>
              ))
          ) : (
              <div className="text-center p-6 border-2 border-dashed rounded-lg text-gray-400">
                  {loading ? "Loading directors..." : "No directors added yet."}
              </div>
          )}
      </div>

      {/* Add New Director Form */}
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 mb-8">
          <h3 className="font-medium mb-4 flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Add New Director
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={newDirector.name}
                    onChange={handleChange}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                    id="position"
                    name="position"
                    placeholder="CEO / Managing Director"
                    value={newDirector.position}
                    onChange={handleChange}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                    id="nationality"
                    name="nationality"
                    placeholder="Ghanaian"
                    value={newDirector.nationality}
                    onChange={handleChange}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone_number">Phone</Label>
                <Input
                    id="phone_number"
                    name="phone_number"
                    placeholder="+233..."
                    value={newDirector.phone_number}
                    onChange={handleChange}
                />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
              <Button 
                onClick={handleAddDirector} 
                disabled={adding}
                variant="secondary"
              >
                  {adding ? "Adding..." : "Add Director"}
              </Button>
          </div>
      </div>

      <div className="flex justify-end pt-2 border-t dark:border-gray-800">
        <Button
          onClick={handleContinue}
          className="bg-[#033783] text-white hover:bg-[#022555] px-8"
          disabled={loading || directors.length === 0}
        >
          {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
          ) : "Save & Continue"}
        </Button>
      </div>
    </motion.div>
  );
}