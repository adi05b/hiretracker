import { useState } from "react";
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

type SortOption = "newest" | "oldest" | "a-z" | "z-a";

function sortApps(apps: Application[], sort: SortOption): Application[] {
  const sorted = [...apps];
  switch (sort) {
    case "newest":
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case "oldest":
      return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    case "a-z":
      return sorted.sort((a, b) => a.company.toLowerCase().localeCompare(b.company.toLowerCase()));
    case "z-a":
      return sorted.sort((a, b) => b.company.toLowerCase().localeCompare(a.company.toLowerCase()));
    default:
      return sorted;
  }
}

interface Props {
  status: string;
  label: string;
  apps: Application[];
  onDelete: (id: number) => void;
}

export default function KanbanColumn({ status, label, apps, onDelete }: Props) {
  const [sort, setSort] = useState<SortOption>("newest");
  const sortedApps = sortApps(apps, sort);

  return (
    <div className={"flex flex-col rounded-lg border-2 min-w-[250px] w-[280px] " + (COLUMN_COLORS[status] || "bg-gray-50 border-gray-300")}>
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className={"font-semibold text-sm uppercase tracking-wide " + (HEADER_COLORS[status] || "text-gray-700")}>
            {label}
          </h2>
          <span className="text-xs bg-white text-gray-500 px-2 py-0.5 rounded-full border">
            {apps.length}
          </span>
        </div>
        {apps.length > 1 && (
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="mt-1.5 w-full text-xs text-gray-500 bg-white border border-gray-200 rounded-md px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="a-z">A → Z</option>
            <option value="z-a">Z → A</option>
          </select>
        )}
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={"flex-1 p-2 min-h-[200px] transition-colors " + (snapshot.isDraggingOver ? "bg-indigo-50" : "")}
          >
            {sortedApps.map((app, index) => (
              <KanbanCard key={app.id} app={app} index={index} onDelete={onDelete} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}