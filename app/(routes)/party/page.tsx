"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Navbar } from "@/app/components/layout/Navbar";
import { parties } from "@/app/data/parties";
import { politicians, getJanamatScore } from "@/app/data/politicians";
import { calcCompositeScore } from "@/app/data/scoring";
import { getGrade } from "@/app/data/scoring";

export default function PartyPage() {
  const partyStats = useMemo(() => {
    return Object.values(parties)
      .filter((p) => p.id !== "independent")
      .map((party) => {
        const members = politicians.filter((p) => p.partyId === party.id);
        if (members.length === 0) {
          return { party, avgScore: 0, memberCount: 0, grade: getGrade(0) };
        }

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

        const avgScore = totalScore / members.length;
        return {
          party,
          avgScore,
          memberCount: members.length,
          grade: getGrade(avgScore),
        };
      })
      .sort((a, b) => b.avgScore - a.avgScore);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <main className="max-w-300 mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Party Leaderboard</h1>
          <p className="text-gray-500 text-sm mt-1">Ranked by average composite score across tracked members.</p>
        </div>

        <div className="space-y-3">
          {partyStats.map(({ party, avgScore, memberCount, grade }, i) => (
            <div
              key={party.id}
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-5 shadow-sm hover:border-[#dc2626] transition-colors"
            >
              <span className="w-7 text-sm font-bold text-gray-400">#{i + 1}</span>

              <div
                className="h-10 w-10 rounded-xl shrink-0 border border-black/5"
                style={{ backgroundColor: party.color }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="font-extrabold text-gray-900 leading-tight">{party.name}</h2>
                  <span className="text-xs text-gray-400">{party.nameNepali}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {party.seats} seats · {memberCount} tracked
                </p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-gray-900">{grade}</div>
                <div className="text-xs text-gray-400 mt-0.5">{Math.round(avgScore)}/100</div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="max-w-300 mx-auto px-6 py-6 text-center text-xs text-gray-400">
          © 2024 Rate My Politician. Built on Solana.
        </div>
      </footer>
    </div>
  );
}
