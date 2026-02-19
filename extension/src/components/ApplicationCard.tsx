import type { Application, Status } from "../api";

const STATUS_COLORS: Record<string, string> = {
  wishlist: "bg-gray-100 text-gray-700",
  applied: "bg-blue-100 text-blue-700",
  oa: "bg-purple-100 text-purple-700",
  interview: "bg-yellow-100 text-yellow-700",
  offer: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const STATUSES: Status[] = ["wishlist", "applied", "oa", "interview", "offer", "rejected"];

interface Props {
  app: Application;
  onStatusChange: (id: number, status: Status) => void;
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

export default function ApplicationCard({ app, onStatusChange, onDelete }: Props) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{app.company}</p>
          <p className="text-xs text-gray-500 truncate">{app.role}</p>
        </div>
        <button onClick={() => onDelete(app.id)} className="text-gray-300 hover:text-red-500 text-xs flex-shrink-0">X</button>
      </div>

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <select value={app.status} onChange={(e) => onStatusChange(app.id, e.target.value as Status)} className={"text-xs font-medium px-2 py-0.5 rounded-full border-none cursor-pointer " + (STATUS_COLORS[app.status] || "bg-gray-100")}>
          {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
        {app.location && <span className="text-xs text-gray-400 truncate">{app.location}</span>}
        <span className="text-xs text-gray-400 ml-auto">{formatDate(app.created_at)}</span>
      </div>

      {app.job_url && <a href={app.job_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline mt-1 block truncate">Open job posting</a>}
    </div>
  );
}