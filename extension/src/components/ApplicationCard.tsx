import { useState } from "react";
import type { Application, Status } from "../api";

const STATUS_COLORS: Record<Status, string> = {
  wishlist: "bg-gray-100 text-gray-700",
  applied: "bg-blue-100 text-blue-700",
  oa: "bg-purple-100 text-purple-700",
  interview: "bg-yellow-100 text-yellow-800",
  offer: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const ALL_STATUSES: Status[] = [
  "wishlist",
  "applied",
  "oa",
  "interview",
  "offer",
  "rejected",
];

interface Props {
  app: Application;
  onStatusChange: (id: number, status: Status) => void;
  onDelete: (id: number) => void;
}

export default function ApplicationCard({
  app,
  onStatusChange,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false);

  const daysAgo = Math.floor(
    (Date.now() - new Date(app.created_at).getTime()) / 86_400_000
  );
  const dateLabel = daysAgo === 0 ? "Today" : daysAgo + "d ago";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 truncate">
            {app.company}
          </h3>
          <p className="text-xs text-gray-500 truncate">{app.role}</p>
        </div>
        <button
          onClick={() => onDelete(app.id)}
          className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
          title="Delete"
        >
          X
        </button>
      </div>

      <div className="flex items-center gap-2 mt-2">
        {editing ? (
          <select
            value={app.status}
            autoFocus
            onChange={(e) => {
              onStatusChange(app.id, e.target.value as Status);
              setEditing(false);
            }}
            onBlur={() => setEditing(false)}
            className="text-xs border rounded px-1 py-0.5"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className={
              "text-xs font-medium px-2 py-0.5 rounded-full " +
              STATUS_COLORS[app.status]
            }
            title="Click to change status"
          >
            {app.status}
          </button>
        )}

        {app.location && (
          <span className="text-xs text-gray-400 truncate">
            {app.location}
          </span>
        )}

        <span className="text-xs text-gray-300 ml-auto flex-shrink-0">
          {dateLabel}
        </span>
      </div>

      {app.job_url && (<a href={app.job_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline mt-1.5 block truncate">Open job posting</a>)}
    </div>
  );
}