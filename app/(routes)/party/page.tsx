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
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <section>
          <h1 className="text-3xl font-black mb-2 text-gray-900 dark:text-white">Party Leaderboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
            Ranked by average composite score across tracked members.
          </p>
        </section>

        <div className="space-y-4">
          {partyStats.map(({ party, avgScore, memberCount, grade }, i) => (
            <div
              key={party.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/60 p-5 flex items-center gap-5 shadow-xs hover:border-red-400 dark:hover:border-red-500 transition-colors"
            >
              <span className="w-7 text-sm font-bold text-gray-450">#{i + 1}</span>

              <div
                className="h-10 w-10 rounded-xl shrink-0 border border-black/5"
                style={{ backgroundColor: party.color }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="font-extrabold text-gray-900 dark:text-white leading-tight">{party.name}</h2>
                  <span className="text-xs font-bold text-gray-400">{party.nameNepali}</span>
                </div>
                <p className="text-xs font-semibold text-gray-500 mt-1">
                  {party.seats} seats · {memberCount} tracked
                </p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-gray-900 dark:text-white">
                  {grade}
                </div>
                <div className="text-xs font-bold text-gray-450 mt-0.5">{Math.round(avgScore)}/100</div>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#dc2626] dark:text-red-400 hover:underline"
        >
          ← Back to Leaderboard
        </Link>
      </main>
    </div>
  );
}
