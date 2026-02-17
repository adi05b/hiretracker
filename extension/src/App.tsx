import { useEffect, useState } from "react";
import { api } from "./api";
import type { Application, ApplicationCreate, Status } from "./api";
import AddForm from "./components/AddForm";
import ApplicationCard from "./components/ApplicationCard";
import StatusFilter from "./components/StatusFilter";

export default function App() {
  const [apps, setApps] = useState<Application[]>([]);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApps = async () => {
    setError(null);
    try {
      const status = filter === "all" ? undefined : filter;
      const data = await api.list(status);
      setApps(data);
    } catch (err: any) {
      setError(err.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [filter]);

  const handleCreate = async (data: ApplicationCreate) => {
    await api.create(data);
    await fetchApps();
  };

  const handleStatusChange = async (id: number, status: Status) => {
    await api.updateStatus(id, status);
    await fetchApps();
  };

  const handleDelete = async (id: number) => {
    await api.delete(id);
    await fetchApps();
  };

  return (
    <div className="bg-white min-h-screen p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">
          <span className="text-indigo-600">Hire</span>Track
        </h1>
        <span className="text-xs text-gray-400">{apps.length} apps</span>
      </div>

      <AddForm onSubmit={handleCreate} />
      <StatusFilter active={filter} onChange={setFilter} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 mb-3">
          {error}
          <span className="block mt-1 text-red-400">
            Is your backend running at localhost:8000?
          </span>
        </div>
      )}

      {loading ? (
        <p className="text-center text-sm text-gray-400 py-8">Loading…</p>
      ) : apps.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400">No applications yet</p>
          <p className="text-xs text-gray-300 mt-1">Click "+ Add Application" to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {apps.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}