"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Navbar } from "./components/layout/Navbar";
import { PoliticianCard } from "./components/politician/PoliticianCard";
import { politicians } from "./data/politicians";
import { calcCompositeScore } from "./data/scoring";
import { getJanamatScore as getScore } from "./data/politicians";

type FilterTab = "all" | "top-rated" | "performance" | "constituency" | "newly-elected";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "top-rated", label: "Top Rated" },
  { key: "performance", label: "By Performance" },
  { key: "constituency", label: "Constituency" },
  { key: "newly-elected", label: "Newly Elected" },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(() => {
    let list = politicians;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.nameNepali.includes(q) ||
          p.constituency.toLowerCase().includes(q) ||
          p.party.toLowerCase().includes(q)
      );
    }

    if (tab === "top-rated" || tab === "all") {
      return [...list].sort((a, b) => {
        const scA = calcCompositeScore(a.parliamentData.attendancePercent, a.parliamentData.billsProposed, a.parliamentData.billsPassed, getScore(a.id), 3);
        const scB = calcCompositeScore(b.parliamentData.attendancePercent, b.parliamentData.billsProposed, b.parliamentData.billsPassed, getScore(b.id), 3);
        return scB.composite - scA.composite;
      });
    }
    if (tab === "performance") {
      return [...list].sort((a, b) => b.parliamentData.attendancePercent - a.parliamentData.attendancePercent);
    }
    if (tab === "constituency") {
      return [...list].sort((a, b) => a.constituency.localeCompare(b.constituency));
    }
    if (tab === "newly-elected") {
      return [...list].sort((a, b) => b.electedYear - a.electedYear);
    }
    return list;
  }, [search, tab]);

  const displayed = showAll ? sorted : sorted.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900">
      <Navbar />

      <main className="max-w-300 mx-auto px-6 py-10 space-y-8">
        {/* Hero */}
        <section className="space-y-4">
          <div>
            <h1 className="text-4xl font-black text-[#dc2626] tracking-tight">
              Track. Rate. Empower.
            </h1>
            <p className="text-gray-600 mt-2 text-sm leading-relaxed">
              Transparent performance tracking for Nepal's political landscape.<br />
              Powered by verified citizen ratings and blockchain technology.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-xl">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by name, constituency, or party..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#dc2626]/30 focus:border-[#dc2626] shadow-sm"
            />
            <button className="absolute inset-y-0 right-3 flex items-center px-2 text-gray-400 hover:text-gray-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
          </div>
        </section>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                tab === t.key
                  ? "bg-[#dc2626] text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <section>
          {sorted.length === 0 ? (
            <p className="text-center text-gray-400 py-20">No politicians match your search.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {displayed.map((p, i) => (
                  <PoliticianCard key={p.id} politician={p} rank={i + 1} avgStars={3} />
                ))}
              </div>

              {!showAll && sorted.length > 4 && (
                <div className="mt-10 flex justify-center">
                  <button
                    onClick={() => setShowAll(true)}
                    className="px-8 py-3 rounded-full border-2 border-[#dc2626] text-[#dc2626] font-bold text-sm hover:bg-[#dc2626] hover:text-white transition-all cursor-pointer"
                  >
                    View All Politicians
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="max-w-300 mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-[#dc2626] font-black text-sm">
              Rate My Politician
            </Link>
            <p className="text-xs text-gray-400 mt-1">© 2024 Rate My Politician. Built on Solana.</p>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <Link href="#" className="hover:text-gray-800 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-gray-800 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-gray-800 transition-colors">Contact</Link>
            <Link href="#" className="hover:text-gray-800 transition-colors">API Documentation</Link>
          </div>
        </div>
      </footer>

      {/* Language toggle */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="h-10 w-10 rounded-full bg-white border border-gray-200 shadow-md text-xs font-bold text-gray-700 hover:shadow-lg transition-all cursor-pointer">
          EN
        </button>
      </div>
    </div>
  );
}
