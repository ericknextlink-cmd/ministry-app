"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { upgradeCriteriaApi, type UpgradeCriteriaItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

export default function AdminUpgradeCriteriaPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<UpgradeCriteriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("access_token");
    if (!t) {
      router.push("/auth");
      return;
    }
    setToken(t);
  }, [router]);

  const fetchItems = async () => {
    if (!token) return;
    try {
      const list = await upgradeCriteriaApi.list(token);
      setItems(list);
    } catch (e: any) {
      if (e?.message?.includes("403") || e?.message?.includes("401")) {
        router.push("/auth");
        return;
      }
      toast.error(e?.message || "Failed to load upgrade criteria");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchItems();
  }, [token]);

  const handleAdd = async () => {
    if (!token || !newText.trim()) return;
    setAdding(true);
    try {
      await upgradeCriteriaApi.create({ text: newText.trim() }, token);
      setNewText("");
      toast.success("Item added.");
      fetchItems();
    } catch (e: any) {
      toast.error(e?.message || "Failed to add item");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (item: UpgradeCriteriaItem) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  const saveEdit = async () => {
    if (!token || editingId == null) return;
    try {
      await upgradeCriteriaApi.update(editingId, { text: editText.trim() }, token);
      setEditingId(null);
      setEditText("");
      toast.success("Item updated.");
      fetchItems();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleDelete = async (id: number) => {
    if (!token || !confirm("Remove this item?")) return;
    try {
      await upgradeCriteriaApi.delete(id, token);
      toast.success("Item removed.");
      fetchItems();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Upgrade criteria</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          List of things to consider for an applicant or company to upgrade class. Applicants will see these when checking upgrade eligibility.
        </p>
      </div>

      <div className="space-y-4">
        {!adding ? (
          <Button
            type="button"
            onClick={() => setAdding(true)}
            className="bg-[#033783] hover:bg-[#022555] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add item
          </Button>
        ) : (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50 space-y-3">
            <Label htmlFor="new-item">New item text</Label>
            <Textarea
              id="new-item"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Enter criteria text..."
              rows={3}
              className="resize-none"
            />
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={adding || !newText.trim()}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
              <Button variant="outline" onClick={() => { setAdding(false); setNewText(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <ul className="space-y-2">
          {items.length === 0 && !adding && (
            <li className="text-sm text-gray-500 dark:text-gray-400 py-4">No items yet. Add one above.</li>
          )}
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900"
            >
              {editingId === item.id ? (
                <>
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={2}
                    className="flex-1 resize-none"
                  />
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" onClick={saveEdit}>Save</Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="flex-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{item.text}</p>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(item)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)} aria-label="Delete">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
