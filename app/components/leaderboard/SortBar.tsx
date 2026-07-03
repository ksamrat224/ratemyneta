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

export function SortBar({ sort, partyFilter, onSortChange, onPartyChange }: SortBarProps) {
  return (
    <div className="space-y-4 w-full">
      {/* Search Input Bar */}
      <div className="relative w-full">
        <input
          type="text"
          placeholder="Search polls, netas or constituencies..."
          className="w-full pl-5 pr-28 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700/60 rounded-full text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#dc2626] dark:focus:border-red-500 transition-colors shadow-xs"
          disabled
        />
        {/* Docked Icon Buttons */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-gray-700" title="Filter">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-gray-700" title="Sort">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Category Pills Row */}
      <div className="flex flex-wrap gap-4 items-center justify-between border-b border-gray-100 dark:border-gray-800/40 pb-3">
        <div className="flex gap-4 flex-wrap items-center">
          <button
            onClick={() => {
              onSortChange("score");
              onPartyChange("");
            }}
            className={clsx(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
              sort === "score" && !partyFilter
                ? "bg-[#dc2626] text-white shadow-xs"
                : "text-gray-500 dark:text-gray-400 hover:text-[#dc2626] dark:hover:text-white"
            )}
          >
            All
          </button>
          <button
            onClick={() => {
              onSortChange("score");
            }}
            className={clsx(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
              sort === "score" && partyFilter !== ""
                ? "bg-[#dc2626] text-white shadow-xs"
                : sort === "score" && !partyFilter
                ? "text-gray-500 dark:text-gray-400 hover:text-[#dc2626] dark:hover:text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-[#dc2626] dark:hover:text-white"
            )}
          >
            Top Rated
          </button>
          <button
            onClick={() => onSortChange("approval")}
            className={clsx(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
              sort === "approval"
                ? "bg-[#dc2626] text-white shadow-xs"
                : "text-gray-500 dark:text-gray-400 hover:text-[#dc2626] dark:hover:text-white"
            )}
          >
            Trending
          </button>
          <button
            onClick={() => onSortChange("attendance")}
            className={clsx(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
              sort === "attendance"
                ? "bg-[#dc2626] text-white shadow-xs"
                : "text-gray-500 dark:text-gray-400 hover:text-[#dc2626] dark:hover:text-white"
            )}
          >
            Recently Rated
          </button>
        </div>

        {/* Party Filter Dropdown styled cleanly */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">By Party:</span>
          <select
            value={partyFilter}
            onChange={(e) => onPartyChange(e.target.value)}
            className={clsx(
              "px-3 py-1.5 rounded-full text-xs font-bold border focus:border-[#dc2626] outline-none transition-colors cursor-pointer bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700",
              partyFilter !== "" && "border-[#dc2626] text-[#dc2626] dark:text-red-400"
            )}
          >
            <option value="">All Parties</option>
            {Object.values(parties).map((p) => (
              <option key={p.id} value={p.id}>
                {p.shortName}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
