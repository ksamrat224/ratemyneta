"use client";

import clsx from "clsx";
import type { SortKey } from "@/types";
import { parties } from "@/app/data/parties";

interface SortBarProps {
  sort: SortKey;
  partyFilter: string;
  onSortChange: (key: SortKey) => void;
  onPartyChange: (partyId: string) => void;
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "score", label: "Overall Score" },
  { key: "attendance", label: "Attendance" },
  { key: "bills", label: "Bills Passed" },
  { key: "approval", label: "Public Approval" },
];

export function SortBar({ sort, partyFilter, onSortChange, onPartyChange }: SortBarProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center justify-between">
      <div className="flex gap-2 flex-wrap">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onSortChange(opt.key)}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              sort === opt.key
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <select
        value={partyFilter}
        onChange={(e) => onPartyChange(e.target.value)}
        className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-0 outline-none"
      >
        <option value="">All Parties</option>
        {Object.values(parties).map((p) => (
          <option key={p.id} value={p.id}>
            {p.shortName}
          </option>
        ))}
      </select>
    </div>
  );
}
