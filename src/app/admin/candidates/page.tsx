"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CandidateAdmin } from "@/types";

const C = {
  primary: "#001857",
  primaryContainer: "#1b2f6e",
  primaryFixed: "#dce1ff",
  surface: "#f7f9ff",
  surfaceContainerLow: "#edf4ff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerHigh: "#d9eaff",
  onSurface: "#091d2e",
  onSurfaceVariant: "#454650",
  outlineVariant: "#c5c5d2",
  secondaryContainer: "#fdab12",
  error: "#ba1a1a",
};

interface CandidateFormData {
  name: string;
  position: string;
  party: string;
  bio: string;
  serialNumber: string;
}

const EMPTY_FORM: CandidateFormData = { name: "", position: "", party: "", bio: "", serialNumber: "" };

export default function AdminCandidatesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<CandidateAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CandidateFormData>(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [symbolFile, setSymbolFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const symbolRef = useRef<HTMLInputElement>(null);

  function fetchCandidates() {
    setLoading(true);
    fetch("/api/admin/candidates")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((j) => setCandidates(j.data ?? []))
      .catch(() => router.push("/admin"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchCandidates(); }, []);

  function openEdit(c: CandidateAdmin) {
    setEditId(c.id);
    setForm({
      name: c.name,
      position: c.position ?? "",
      party: c.party ?? "",
      bio: c.bio ?? "",
      serialNumber: String(c.serialNumber),
    });
    setPhotoFile(null);
    setSymbolFile(null);
    setShowForm(true);
  }

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setPhotoFile(null);
    setSymbolFile(null);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("position", form.position);
      fd.append("party", form.party);
      fd.append("bio", form.bio);
      if (form.serialNumber) fd.append("serialNumber", form.serialNumber);
      if (photoFile) fd.append("photo", photoFile);
      if (symbolFile) fd.append("symbol", symbolFile);

      const url = editId ? `/api/admin/candidates/${editId}` : "/api/admin/candidates";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, { method, body: fd });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Save failed."); return; }
      toast.success(editId ? "Candidate updated." : "Candidate created.");
      setShowForm(false);
      fetchCandidates();
    } catch { toast.error("Network error."); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/candidates/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Delete failed."); return; }
      toast.success("Candidate removed.");
      setDeleteConfirm(null);
      fetchCandidates();
    } catch { toast.error("Network error."); }
  }

  async function handleReorder(id: string, dir: "up" | "down") {
    const idx = candidates.findIndex((c) => c.id === id);
    if ((dir === "up" && idx === 0) || (dir === "down" && idx === candidates.length - 1)) return;
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    const updated = [...candidates];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];

    const orders = updated.map((c, i) => ({ id: c.id, displayOrder: i }));
    await fetch("/api/admin/candidates/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders }),
    });
    setCandidates(updated);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: C.primary }}>Candidates</h1>
          <p className="text-sm mt-0.5" style={{ color: C.onSurfaceVariant }}>
            {candidates.length} candidates configured
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-[0.98]"
          style={{ backgroundColor: C.primaryContainer, color: "#ffffff" }}
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add Candidate
        </button>
      </div>

      {/* Candidate cards */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <span className="material-symbols-outlined animate-spin text-3xl" style={{ color: C.primary }}>
            progress_activity
          </span>
        </div>
      ) : candidates.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: C.surfaceContainerLowest, border: `1px dashed ${C.outlineVariant}` }}
        >
          <span className="material-symbols-outlined text-4xl mb-3" style={{ color: C.onSurfaceVariant }}>
            person_add
          </span>
          <p className="font-semibold" style={{ color: C.onSurfaceVariant }}>
            No candidates yet. Add your first candidate.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((c, idx) => (
            <div
              key={c.id}
              className="flex items-center gap-4 p-4 rounded-xl"
              style={{
                backgroundColor: C.surfaceContainerLowest,
                boxShadow: "0 1px 6px rgba(9,29,46,0.06)",
                border: `1px solid ${C.outlineVariant}30`,
              }}
            >
              {/* Reorder */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleReorder(c.id, "up")}
                  disabled={idx === 0}
                  className="p-1 rounded disabled:opacity-20"
                >
                  <span className="material-symbols-outlined text-sm" style={{ color: C.onSurfaceVariant }}>
                    arrow_upward
                  </span>
                </button>
                <button
                  onClick={() => handleReorder(c.id, "down")}
                  disabled={idx === candidates.length - 1}
                  className="p-1 rounded disabled:opacity-20"
                >
                  <span className="material-symbols-outlined text-sm" style={{ color: C.onSurfaceVariant }}>
                    arrow_downward
                  </span>
                </button>
              </div>

              {/* Serial number */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: C.surfaceContainerHigh, color: C.primary }}
              >
                {c.serialNumber}
              </div>

              {/* Photo */}
              {c.photoUrl ? (
                <img
                  src={c.photoUrl}
                  alt={c.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: C.surfaceContainerHigh }}
                >
                  <span className="material-symbols-outlined" style={{ color: C.onSurfaceVariant }}>person</span>
                </div>
              )}

              {/* Info */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold truncate" style={{ color: C.onSurface }}>{c.name}</p>
                  {c.isNota && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: C.surfaceContainerHigh, color: C.onSurfaceVariant }}
                    >
                      NOTA
                    </span>
                  )}
                </div>
                <p className="text-sm truncate" style={{ color: C.onSurfaceVariant }}>
                  {[c.position, c.party].filter(Boolean).join(" · ")}
                </p>
              </div>

              {/* Symbol */}
              {c.symbolUrl && (
                <img
                  src={c.symbolUrl}
                  alt="symbol"
                  className="w-8 h-8 object-contain rounded flex-shrink-0"
                />
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(c)}
                  className="p-2 rounded-lg transition-all"
                  style={{ backgroundColor: C.surfaceContainerLow }}
                >
                  <span className="material-symbols-outlined text-sm" style={{ color: C.primary }}>edit</span>
                </button>
                {deleteConfirm === c.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="px-2 py-2 rounded-lg text-xs font-bold"
                      style={{ backgroundColor: C.error, color: "#fff" }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-2 py-2 rounded-lg text-xs font-bold"
                      style={{ backgroundColor: C.surfaceContainerHigh, color: C.onSurfaceVariant }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(c.id)}
                    className="p-2 rounded-lg transition-all"
                    style={{ backgroundColor: "rgba(186,26,26,0.08)" }}
                  >
                    <span className="material-symbols-outlined text-sm" style={{ color: C.error }}>delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(9,29,46,0.5)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ backgroundColor: C.surfaceContainerLowest, boxShadow: "0 24px 64px rgba(9,29,46,0.2)" }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: `${C.outlineVariant}30` }}
            >
              <h2 className="font-bold text-lg" style={{ color: C.primary }}>
                {editId ? "Edit Candidate" : "Add Candidate"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-full"
                style={{ backgroundColor: C.surfaceContainerHigh }}
              >
                <span className="material-symbols-outlined text-sm" style={{ color: C.onSurfaceVariant }}>close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {[
                { id: "name", label: "Full Name *", key: "name" as keyof CandidateFormData, required: true },
                { id: "position", label: "Position / Designation", key: "position" as keyof CandidateFormData },
                { id: "party", label: "Party / Alliance", key: "party" as keyof CandidateFormData },
                { id: "serial", label: "Serial Number", key: "serialNumber" as keyof CandidateFormData, type: "number" },
              ].map((field) => (
                <div key={field.id} className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wide" style={{ color: C.onSurfaceVariant }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type ?? "text"}
                    required={field.required}
                    value={form[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm"
                    style={{
                      borderColor: C.outlineVariant,
                      backgroundColor: C.surface,
                      color: C.onSurface,
                      outline: "none",
                    }}
                  />
                </div>
              ))}

              {/* Bio */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wide" style={{ color: C.onSurfaceVariant }}>
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm resize-none"
                  style={{
                    borderColor: C.outlineVariant,
                    backgroundColor: C.surface,
                    color: C.onSurface,
                    outline: "none",
                  }}
                />
              </div>

              {/* Photo upload */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wide" style={{ color: C.onSurfaceVariant }}>
                  Candidate Photo
                </label>
                <label
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer border-dashed"
                  style={{ borderColor: C.outlineVariant, backgroundColor: C.surfaceContainerLow }}
                >
                  <span className="material-symbols-outlined text-sm" style={{ color: C.onSurfaceVariant }}>
                    add_photo_alternate
                  </span>
                  <span className="text-sm" style={{ color: C.onSurfaceVariant }}>
                    {photoFile ? photoFile.name : "Click to upload photo"}
                  </span>
                  <input
                    ref={photoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              {/* Symbol upload */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wide" style={{ color: C.onSurfaceVariant }}>
                  Election Symbol
                </label>
                <label
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer border-dashed"
                  style={{ borderColor: C.outlineVariant, backgroundColor: C.surfaceContainerLow }}
                >
                  <span className="material-symbols-outlined text-sm" style={{ color: C.onSurfaceVariant }}>
                    image
                  </span>
                  <span className="text-sm" style={{ color: C.onSurfaceVariant }}>
                    {symbolFile ? symbolFile.name : "Click to upload symbol"}
                  </span>
                  <input
                    ref={symbolRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setSymbolFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm border"
                  style={{ borderColor: C.outlineVariant, color: C.onSurfaceVariant }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all"
                  style={{ backgroundColor: C.primaryContainer, opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? "Saving..." : editId ? "Update Candidate" : "Add Candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
