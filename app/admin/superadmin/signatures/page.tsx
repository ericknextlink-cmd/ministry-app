"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { PenTool, Type, Upload, Trash2, Loader2 } from "lucide-react";

const SIGNATURE_SLOTS = [
  { id: "signature1.png", label: "Signature 1" },
  { id: "signature2.png", label: "Signature 2" },
] as const;

type Mode = "type" | "draw" | "upload" | null;

export default function SignaturesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [signatures, setSignatures] = useState<{ name: string }[]>([]);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [typedText, setTypedText] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);

  const fetchSignatures = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    setLoading(true);
    try {
      const data = await adminApi.listSignatures(token);
      setSignatures(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Failed to load signatures.");
      setSignatures([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSignatures();
  }, [fetchSignatures]);

  const getPreviewUrl = useCallback(
    (filename: string) => {
      const exists = signatures.some((s) => (s.name || s).toString() === filename);
      if (!exists) return null;
      const base = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const token = localStorage.getItem("access_token");
      return `${base}/api/v1/admin/signatures/preview/${filename}?token=${token}`;
    },
    [signatures]
  );

  const handleUploadFile = async (slotId: string, file: File) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("Not authenticated.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a PNG or JPG image.");
      return;
    }
    const ext = file.name.toLowerCase().endsWith(".png") ? ".png" : ".jpg";
    const renamed = new File([file], slotId, { type: file.type });
    setUploadingSlot(slotId);
    try {
      await adminApi.uploadSignature(renamed, token);
      toast.success(`${slotId} updated.`);
      await fetchSignatures();
      setMode(null);
      setActiveSlot(null);
    } catch (e) {
      toast.error("Upload failed.");
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleTypeSubmit = async (slotId: string) => {
    if (!typedText.trim()) {
      toast.error("Enter signature text.");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 400;
    canvas.height = 120;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000000";
    ctx.font = "italic 48px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedText.trim(), canvas.width / 2, canvas.height / 2);
    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const file = new File([blob], slotId, { type: "image/png" });
        setUploadingSlot(slotId);
        try {
          await adminApi.uploadSignature(file, token);
          toast.success(`${slotId} updated.`);
          await fetchSignatures();
          setMode(null);
          setActiveSlot(null);
          setTypedText("");
        } catch (e) {
          toast.error("Upload failed.");
        } finally {
          setUploadingSlot(null);
        }
      },
      "image/png",
      0.95
    );
  };

  const startDraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    drawingRef.current = true;
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = "touches" in e ? e.touches[0]?.clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY : e.clientY;
    if (clientX == null || clientY == null) return;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  const endDraw = useCallback(() => {
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
  }, []);

  const handleDrawSubmit = async (slotId: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;
    setUploadingSlot(slotId);
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setUploadingSlot(null);
          return;
        }
        const file = new File([blob], slotId, { type: "image/png" });
        try {
          await adminApi.uploadSignature(file, token);
          toast.success(`${slotId} updated.`);
          await fetchSignatures();
          setMode(null);
          setActiveSlot(null);
        } catch (e) {
          toast.error("Upload failed.");
        } finally {
          setUploadingSlot(null);
        }
      },
      "image/png",
      0.95
    );
  };

  const handleDelete = async (filename: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      await adminApi.deleteSignature(filename, token);
      toast.success("Signature removed.");
      await fetchSignatures();
    } catch (e) {
      toast.error("Delete failed.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Certificate Signatures</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage signatures used on certificates. Upload to Supabase (templates/signatures/). Add via typed text, freehand draw, or image upload.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {SIGNATURE_SLOTS.map(({ id, label }) => {
          const isUploading = uploadingSlot === id;
          const isActive = activeSlot === id;
          const hasFile = signatures.some((s) => (s.name || s).toString() === id);

          return (
            <Card key={id} className="dark:bg-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{label}</CardTitle>
                {hasFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {!isActive ? (
                  <>
                    <div className="border rounded-lg bg-gray-50 dark:bg-gray-900 min-h-[120px] flex items-center justify-center p-4">
                      {hasFile ? (
                        <p className="text-sm text-gray-500">Stored: {id}</p>
                      ) : (
                        <p className="text-sm text-gray-500">No signature set</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveSlot(id);
                          setMode("type");
                          setTypedText("");
                        }}
                      >
                        <Type className="h-4 w-4 mr-1" /> Type
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveSlot(id);
                          setMode("draw");
                          setTimeout(() => {
                            const c = canvasRef.current;
                            if (c) {
                              c.width = 400;
                              c.height = 120;
                              const ctx = c.getContext("2d");
                              if (ctx) {
                                ctx.fillStyle = "#ffffff";
                                ctx.fillRect(0, 0, c.width, c.height);
                              }
                            }
                          }, 0);
                        }}
                      >
                        <PenTool className="h-4 w-4 mr-1" /> Draw
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveSlot(id);
                          setMode("upload");
                          fileInputRef.current?.click();
                        }}
                      >
                        <Upload className="h-4 w-4 mr-1" /> Upload
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {mode === "type" && (
                      <>
                        <input
                          type="text"
                          placeholder="Type signature text"
                          className="w-full border rounded px-3 py-2 dark:bg-gray-900 dark:border-gray-700"
                          value={typedText}
                          onChange={(e) => setTypedText(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => handleTypeSubmit(id)} disabled={isUploading}>
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                          </Button>
                          <Button variant="outline" onClick={() => { setMode(null); setActiveSlot(null); }}>Cancel</Button>
                        </div>
                      </>
                    )}
                    {mode === "draw" && (
                      <>
                        <canvas
                          ref={canvasRef}
                          width={400}
                          height={120}
                          className="border rounded w-full max-w-full bg-white touch-none cursor-crosshair"
                          style={{ maxHeight: 120 }}
                          onMouseDown={startDraw}
                          onMouseMove={draw}
                          onMouseUp={endDraw}
                          onMouseLeave={endDraw}
                          onTouchStart={startDraw}
                          onTouchMove={draw}
                          onTouchEnd={endDraw}
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => handleDrawSubmit(id)} disabled={isUploading}>
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                          </Button>
                          <Button variant="outline" onClick={() => { setMode(null); setActiveSlot(null); }}>Cancel</Button>
                        </div>
                      </>
                    )}
                    {mode === "upload" && (
                      <div className="flex flex-wrap gap-2 items-center">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f && activeSlot) {
                              handleUploadFile(activeSlot, f);
                              e.target.value = "";
                            }
                            setMode(null);
                            setActiveSlot(null);
                          }}
                        />
                        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Choose image (PNG/JPG)"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setMode(null); setActiveSlot(null); }}>Cancel</Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
