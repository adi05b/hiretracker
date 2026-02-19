import { Droppable } from "@hello-pangea/dnd";
import type { Application } from "../api";
import KanbanCard from "./KanbanCard";

const COLUMN_COLORS: Record<string, string> = {
  wishlist: "bg-gray-50 border-gray-300",
  applied: "bg-blue-50 border-blue-300",
  oa: "bg-purple-50 border-purple-300",
  interview: "bg-yellow-50 border-yellow-300",
  offer: "bg-green-50 border-green-300",
  rejected: "bg-red-50 border-red-300",
};

const HEADER_COLORS: Record<string, string> = {
  wishlist: "text-gray-700",
  applied: "text-blue-700",
  oa: "text-purple-700",
  interview: "text-yellow-700",
  offer: "text-green-700",
  rejected: "text-red-700",
};

interface Props {
  status: string;
  label: string;
  apps: Application[];
  onDelete: (id: number) => void;
}

export default function KanbanColumn({ status, label, apps, onDelete }: Props) {
  return (
    <div
      className={
        "flex flex-col rounded-lg border-2 min-w-[250px] w-[280px] " +
        (COLUMN_COLORS[status] || "bg-gray-50 border-gray-300")
      }
    >
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2
            className={
              "font-semibold text-sm uppercase tracking-wide " +
              (HEADER_COLORS[status] || "text-gray-700")
            }
          >
            {label}
          </h2>
          <span className="text-xs bg-white text-gray-500 px-2 py-0.5 rounded-full border">
            {apps.length}
          </span>
        </div>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={
              "flex-1 p-2 min-h-[200px] transition-colors " +
              (snapshot.isDraggingOver ? "bg-indigo-50" : "")
            }
          >
            {apps.map((app, index) => (
              <KanbanCard
                key={app.id}
                app={app}
                index={index}
                onDelete={onDelete}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}