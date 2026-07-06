"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Navbar } from "@/app/components/layout/Navbar";
import { parties } from "@/app/data/parties";
import { politicians, getJanamatScore } from "@/app/data/politicians";
import { calcCompositeScore, getGrade } from "@/app/data/scoring";

const FILTER_TABS = ["All", "National Parties", "Regional", "Coalitions"];

const NATIONAL_PARTY_IDS = ["nc", "cpn_uml", "cpn_mc", "rpp", "rsn"];
const REGIONAL_PARTY_IDS = ["janmat"];

function gradeColor(grade: string) {
  if (grade.startsWith("A")) return "#16a34a";
  if (grade.startsWith("B")) return "#2563eb";
  if (grade.startsWith("C")) return "#d97706";
  if (grade.startsWith("D")) return "#ea580c";
  return "#dc2626";
}

function avgAttendance(partyId: string): number {
  const members = politicians.filter((p) => p.partyId === partyId);
  if (members.length === 0) return 0;
  return Math.round(members.reduce((s, p) => s + p.parliamentData.attendancePercent, 0) / members.length);
}

export default function PartyPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selected, setSelected] = useState<string[]>([]);

  const partyStats = useMemo(() => {
    return Object.values(parties)
      .filter((p) => p.id !== "independent")
      .map((party) => {
        const members = politicians.filter((p) => p.partyId === party.id);
        const totalScore = members.reduce((sum, politician) => {
          const janamat = getJanamatScore(politician.id);
          const { composite } = calcCompositeScore(
            politician.parliamentData.attendancePercent,
            politician.parliamentData.billsProposed,
            politician.parliamentData.billsPassed,
            janamat,
            3
          );
          return sum + composite;
        }, 0);
        const avgScore = members.length > 0 ? totalScore / members.length : 0;
        return {
          party,
          avgScore,
          memberCount: members.length,
          grade: getGrade(avgScore),
          attendance: avgAttendance(party.id),
          isNational: NATIONAL_PARTY_IDS.includes(party.id),
          isRegional: REGIONAL_PARTY_IDS.includes(party.id),
        };
      })
      .sort((a, b) => b.avgScore - a.avgScore);
  }, []);

  const filtered = useMemo(() => {
    let list = partyStats;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.party.name.toLowerCase().includes(q) ||
          s.party.nameNepali.includes(q) ||
          s.party.shortName.toLowerCase().includes(q)
      );
    }
    if (activeFilter === "National Parties") list = list.filter((s) => s.isNational);
    else if (activeFilter === "Regional") list = list.filter((s) => s.isRegional);
    return list;
  }, [partyStats, search, activeFilter]);

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <main className="max-w-400 mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-gray-900">
            Compare Political Parties{" "}
            <span className="text-[#dc2626]">(राजनीतिक दलहरूको तुलना)</span>
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xl">
            Explore real-time data on party attendance records, legislative contributions, and member
            engagement metrics to make informed civic choices.
          </p>
        </div>

        {/* Search + Filter row */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap items-center gap-3 shadow-sm">
          {/* Search */}
          <div className="relative flex-1 min-w-52">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search parties by name or symbol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626]/30 focus:border-[#dc2626]"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                  activeFilter === tab
                    ? "bg-[#dc2626] text-white"
                    : "border border-gray-300 text-gray-600 hover:border-[#dc2626] hover:text-[#dc2626] bg-white"
                }`}
              >
                {tab}
              </button>
            ))}
            <button className="px-4 py-2 rounded-full text-sm font-semibold border border-gray-300 text-gray-600 hover:border-[#dc2626] hover:text-[#dc2626] bg-white flex items-center gap-1.5 cursor-pointer transition-colors">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filter
            </button>
          </div>
        </div>

        {/* Party cards grid */}
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-16">No parties match your search.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(({ party, memberCount, grade, attendance }) => {
              const isSelected = selected.includes(party.id);
              const gColor = gradeColor(grade);
              return (
                <div
                  key={party.id}
                  onClick={() => toggleSelect(party.id)}
                  className={`bg-white rounded-2xl border-2 transition-all cursor-pointer shadow-sm hover:shadow-md overflow-hidden ${
                    isSelected ? "border-[#dc2626]" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {/* Top section: logo + badges */}
                  <div className="relative p-4 pb-3">
                    {/* Logo */}
                    <div
                      className="h-14 w-14 rounded-xl border border-black/10 flex items-center justify-center text-white font-black text-lg"
                      style={{ backgroundColor: party.color }}
                    >
                      {party.shortName.slice(0, 2)}
                    </div>

                    {/* Top-right badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                      <span className="bg-[#dc2626] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Avg. Attendance → {attendance}%
                      </span>
                      <span className="bg-[#1e40af] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Active Members → {memberCount}
                      </span>
                    </div>
                  </div>

                  {/* Status pills */}
                  <div className="px-4 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-green-500 text-green-600">Active</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-gray-400 text-gray-500">Registered</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-gray-400 text-gray-500">National</span>
                  </div>

                  {/* Party name */}
                  <div className="px-4 pt-2.5 pb-1">
                    <h2 className="font-extrabold text-gray-900 text-base leading-tight">
                      {party.name} / {party.nameNepali}
                    </h2>
                  </div>

                  {/* Divider */}
                  <div className="mx-4 border-t border-gray-100 mt-3" />

                  {/* Footer row */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Total Candidates:{" "}
                      <span className="font-semibold text-gray-700">{party.seats}</span>
                    </span>
                    <div
                      className="h-9 w-9 rounded-full border-2 flex items-center justify-center font-black text-xs"
                      style={{ borderColor: gColor, color: gColor }}
                    >
                      {grade}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA: Build Comparative Report */}
        <div
          className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)" }}
        >
          <div>
            <h2 className="text-xl font-black text-white">Build Your Comparative Report</h2>
            <p className="text-white/80 text-sm mt-1">
              Select up to 3 parties to see a head-to-head performance breakdown.
            </p>
          </div>
          <button
            className="shrink-0 px-5 py-2.5 rounded-xl border-2 border-white text-white font-bold text-sm hover:bg-white hover:text-[#dc2626] transition-colors cursor-pointer"
          >
            Compare Selected Parties ({selected.length})
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="max-w-400 mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-[#dc2626] font-black text-base">Rate My Politician</Link>
            <p className="text-xs text-gray-400 mt-0.5">© 2024 Rate My Politician. Powered by Solana.</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <Link href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-gray-600 transition-colors">Civic Data API</Link>
            <Link href="#" className="hover:text-gray-600 transition-colors">Contact</Link>
          </div>
          <div className="flex items-center gap-3 text-gray-400">
            <button className="hover:text-gray-600 transition-colors cursor-pointer">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </button>
            <button className="hover:text-gray-600 transition-colors cursor-pointer">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
