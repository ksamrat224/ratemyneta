"use client";

import { useState, useMemo } from "react";
import { Navbar } from "@/app/components/layout/Navbar";
import { PoliticianCard } from "@/app/components/politician/PoliticianCard";
import { politicians } from "@/app/data/politicians";
import { calcCompositeScore } from "@/app/data/scoring";
import { getJanamatScore as getScore } from "@/app/data/politicians";
import { parties } from "@/app/data/parties";

export default function PoliticiansPage() {
  const [search, setSearch] = useState("");
  const [partyFilter, setPartyFilter] = useState("");

  const filtered = useMemo(() => {
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

    if (partyFilter) {
      list = list.filter((p) => p.partyId === partyFilter);
    }

    return [...list].sort((a, b) => {
      const scA = calcCompositeScore(a.parliamentData.attendancePercent, a.parliamentData.billsProposed, a.parliamentData.billsPassed, getScore(a.id), 3);
      const scB = calcCompositeScore(b.parliamentData.attendancePercent, b.parliamentData.billsProposed, b.parliamentData.billsPassed, getScore(b.id), 3);
      return scB.composite - scA.composite;
    });
  }, [search, partyFilter]);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <main className="max-w-300 mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">All Politicians</h1>
          <p className="text-gray-500 text-sm mt-1">{politicians.length} politicians tracked on-chain</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-60">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search politicians..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626]/30 focus:border-[#dc2626]"
            />
          </div>
          <select
            value={partyFilter}
            onChange={(e) => setPartyFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#dc2626]/30 focus:border-[#dc2626] cursor-pointer"
          >
            <option value="">All Parties</option>
            {Object.values(parties).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-20">No politicians match your search.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filtered.map((p, i) => (
              <PoliticianCard key={p.id} politician={p} rank={i + 1} avgStars={3} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="max-w-300 mx-auto px-6 py-6 text-center text-xs text-gray-400">
          © 2024 Rate My Politician. Built on Solana.
        </div>
      </footer>
    </div>
  );
}
