import { useEffect, useState } from "react";
import { api, getToken, getStoredUser, clearAuth } from "./api";
import type { Application, ApplicationCreate, Status, User } from "./api";
import AddForm from "./components/AddForm";
import ApplicationCard from "./components/ApplicationCard";
import StatusFilter from "./components/StatusFilter";
import AuthScreen from "./components/AuthScreen";

export default function App() {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [apps, setApps] = useState<Application[]>([]);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = !!user && !!getToken();

  const fetchApps = async () => {
    setError(null);
    try {
      const status = filter === "all" ? undefined : filter;
      const data = await api.list(status);
      setApps(data);
    } catch (err: any) {
      if (err.message.includes("Session expired")) {
        setUser(null);
      }
      setError(err.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchApps();
  }, [filter, isLoggedIn]);

  if (!isLoggedIn) {
    return <AuthScreen onLogin={(u) => setUser(u)} />;
  }

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

  const handleLogout = () => {
    clearAuth();
    setUser(null);
  };

  const openDashboard = () => {
    const url = chrome.runtime.getURL("dashboard.html");
    chrome.tabs.create({ url });
  };

  return (
    <div className="bg-white min-h-screen p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">
          <span className="text-indigo-600">Hire</span>Track
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{user.name || user.email}</span>
          <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-600">Logout</button>
        </div>
      </div>

      <button onClick={openDashboard} className="w-full py-2 mb-2 bg-white border border-indigo-200 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-50 transition-colors">
        Open Kanban Dashboard
      </button>

      <AddForm onSubmit={handleCreate} />
      <StatusFilter active={filter} onChange={setFilter} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 mb-3">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-center text-sm text-gray-400 py-8">Loading...</p>
      ) : apps.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400">No applications yet</p>
          <p className="text-xs text-gray-300 mt-1">Click "+ Add Application" to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {apps.map((app) => (
            <ApplicationCard key={app.id} app={app} onStatusChange={handleStatusChange} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}