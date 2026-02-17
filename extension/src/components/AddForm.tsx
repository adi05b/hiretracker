import { useState } from "react";
import type { ApplicationCreate, Status } from "../api";

interface Props {
  onSubmit: (data: ApplicationCreate) => Promise<void>;
}

const INITIAL: ApplicationCreate = {
  company: "",
  role: "",
  location: "",
  job_url: "",
  status: "wishlist",
  notes: "",
};

export default function AddForm({ onSubmit }: Props) {
  const [form, setForm] = useState<ApplicationCreate>(INITIAL);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (field: keyof ApplicationCreate, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.company.trim() || !form.role.trim()) return;
    setSaving(true);
    try {
      await onSubmit(form);
      setForm(INITIAL);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors mb-3"
      >
        + Add Application
      </button>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 space-y-2">
      <input type="text" placeholder="Company *" value={form.company}
        onChange={(e) => set("company", e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        autoFocus />
      <input type="text" placeholder="Role *" value={form.role}
        onChange={(e) => set("role", e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
      <input type="text" placeholder="Location" value={form.location}
        onChange={(e) => set("location", e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
      <input type="url" placeholder="Job URL" value={form.job_url}
        onChange={(e) => set("job_url", e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
      <select value={form.status}
        onChange={(e) => set("status", e.target.value as Status)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
        <option value="wishlist">Wishlist</option>
        <option value="applied">Applied</option>
        <option value="oa">Online Assessment</option>
        <option value="interview">Interview</option>
        <option value="offer">Offer</option>
        <option value="rejected">Rejected</option>
      </select>
      <textarea placeholder="Notes (optional)" value={form.notes}
        onChange={(e) => set("notes", e.target.value)} rows={2}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" />
      <div className="flex gap-2">
        <button onClick={handleSubmit}
          disabled={saving || !form.company.trim() || !form.role.trim()}
          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-md transition-colors">
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={() => { setForm(INITIAL); setOpen(false); }}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}