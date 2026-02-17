import type { Status } from "../api";

const FILTERS: { label: string; value: Status | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Wishlist", value: "wishlist" },
  { label: "Applied", value: "applied" },
  { label: "OA", value: "oa" },
  { label: "Interview", value: "interview" },
  { label: "Offer", value: "offer" },
  { label: "Rejected", value: "rejected" },
];

interface Props {
  active: Status | "all";
  onChange: (value: Status | "all") => void;
}

export default function StatusFilter({ active, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
            active === f.value
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}