import { useState, useEffect } from "react";
import KanbanBoard from "../components/KanbanBoard";
import AnalyticsPanel from "../components/AnalyticsPanel";
import AuthScreen from "../components/AuthScreen";
import { getToken, getStoredUser, clearAuth, clearTokenFromExtension } from "../api";
import type { User } from "../api";

type Tab = "kanban" | "analytics";

export default function DashboardApp() {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [tab, setTab] = useState<Tab>("kanban");

  const isLoggedIn = !!user && !!getToken();

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-96">
          <AuthScreen onLogin={(u) => setUser(u)} />
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    clearAuth();
    clearTokenFromExtension();
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              <span className="text-indigo-600">Hire</span>Track
            </h1>

            <nav className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTab("kanban")}
                className={
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-colors " +
                  (tab === "kanban"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700")
                }
              >
                Kanban Board
              </button>
              <button
                onClick={() => setTab("analytics")}
                className={
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-colors " +
                  (tab === "analytics"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700")
                }
              >
                Analytics
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user.name || user.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-400 hover:text-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto">
        {tab === "kanban" ? <KanbanBoard /> : <AnalyticsPanel />}
      </div>
    </div>
  );
}