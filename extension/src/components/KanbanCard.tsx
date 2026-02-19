import { Draggable } from "@hello-pangea/dnd";
import type { Application } from "../api";

interface Props {
  app: Application;
  index: number;
  onDelete: (id: number) => void;
}

function formatDate(utcDateStr: string): string {
    // Ensure the date is treated as UTC
    const raw = utcDateStr.endsWith("Z") ? utcDateStr : utcDateStr + "Z";
    const date = new Date(raw);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86_400_000);
  
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${month}/${day}`;
  
    if (diffDays === 0) return `${dateStr}, Today`;
    if (diffDays === 1) return `${dateStr}, 1 day`;
    return `${dateStr}, ${diffDays} days`;
  }

export default function KanbanCard({ app, index, onDelete }: Props) {
  return (
    <Draggable draggableId={String(app.id)} index={index}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={"bg-white rounded-lg border p-3 mb-2 cursor-grab active:cursor-grabbing transition-shadow " + (snapshot.isDragging ? "shadow-lg border-indigo-300" : "border-gray-200 hover:shadow-sm")}>
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{app.company}</p>
              <p className="text-xs text-gray-500 truncate">{app.role}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onDelete(app.id); }} className="text-gray-300 hover:text-red-500 text-xs flex-shrink-0">X</button>
          </div>

          {app.location && <p className="text-xs text-gray-400 mt-1 truncate">{app.location}</p>}

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{formatDate(app.created_at)}</span>
            {app.source !== "manual" && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{app.source}</span>}
          </div>

          {app.job_url && <a href={app.job_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-indigo-500 hover:underline mt-1 block truncate">Open posting</a>}
        </div>
      )}
    </Draggable>
  );
}