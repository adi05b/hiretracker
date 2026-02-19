import { useEffect, useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { api } from "../api";
import type { Application, Status } from "../api";
import KanbanColumn from "./KanbanColumn";

const COLUMNS: { status: Status; label: string }[] = [
  { status: "wishlist", label: "Wishlist" },
  { status: "applied", label: "Applied" },
  { status: "oa", label: "OA" },
  { status: "interview", label: "Interview" },
  { status: "offer", label: "Offer" },
  { status: "rejected", label: "Rejected" },
];

export default function KanbanBoard() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApps = async () => {
    setError(null);
    try {
      const data = await api.list();
      setApps(data);
    } catch (err: any) {
      setError(err.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const grouped: Record<string, Application[]> = {};
  for (const col of COLUMNS) {
    grouped[col.status] = apps.filter((a) => a.status === col.status);
  }

  const onDragEnd = async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    const newStatus = destination.droppableId as Status;
    const appId = parseInt(draggableId);

    const app = apps.find((a) => a.id === appId);
    if (!app || app.status === newStatus) return;

    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );

    try {
      await api.updateStatus(appId, newStatus);
    } catch {
      fetchApps();
    }
  };

  const handleDelete = async (id: number) => {
    setApps((prev) => prev.filter((a) => a.id !== id));
    try {
      await api.delete(id);
    } catch {
      fetchApps();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 m-4">
        <p>{error}</p>
        <p className="text-sm text-red-400 mt-1">
          Is your backend running at localhost:8000?
        </p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-4 min-h-screen">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            label={col.label}
            apps={grouped[col.status]}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </DragDropContext>
  );
}