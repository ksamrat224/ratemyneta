"use client";

import { useState, useMemo } from "react";
import { Navbar } from "./components/layout/Navbar";
import { StatsRow } from "./components/leaderboard/StatsRow";
import { SortBar } from "./components/leaderboard/SortBar";
import { PoliticianCard } from "./components/politician/PoliticianCard";
import { GridBackground } from "./components/grid-background";
import { ClusterSelect } from "./components/cluster-select";
import { politicians } from "./data/politicians";
import { calcCompositeScore } from "./data/scoring";
import { getJanamatScore as getScore } from "./data/politicians";
import type { SortKey } from "@/types";

export default function Home() {
  const [sort, setSort] = useState<SortKey>("score");
  const [partyFilter, setPartyFilter] = useState("");

  const sorted = useMemo(() => {
    let list = politicians;
    if (partyFilter) {
      list = list.filter((p) => p.partyId === partyFilter);
    }

    return [...list].sort((a, b) => {
      const jA = getScore(a.id);
      const jB = getScore(b.id);
      const scA = calcCompositeScore(
        a.parliamentData.attendancePercent,
        a.parliamentData.billsProposed,
        a.parliamentData.billsPassed,
        jA,
        3
      );
      const scB = calcCompositeScore(
        b.parliamentData.attendancePercent,
        b.parliamentData.billsProposed,
        b.parliamentData.billsPassed,
        jB,
        3
      );

      if (sort === "score") return scB.composite - scA.composite;
      if (sort === "attendance")
        return b.parliamentData.attendancePercent - a.parliamentData.attendancePercent;
      if (sort === "bills")
        return b.parliamentData.billsPassed - a.parliamentData.billsPassed;
      if (sort === "approval") return jB - jA;
      return 0;
    });
  }, [sort, partyFilter]);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <GridBackground />
      <div className="relative z-10">
        <Navbar />

        <main className="max-w-[1400px] mx-auto px-6 py-10 space-y-10">
          {/* Hero */}
          <section className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                  Rate My Neta
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Civic accountability for Nepal — verified by Janamat, immutable on Solana.
                </p>
              </div>
              <ClusterSelect />
            </div>
          </section>

          {/* Stats */}
          <StatsRow onChainRatings={0} zkVerifiedCount={0} />

          {/* Sort + filter */}
          <SortBar
            sort={sort}
            partyFilter={partyFilter}
            onSortChange={setSort}
            onPartyChange={setPartyFilter}
          />

          {/* Leaderboard */}
          <section className="space-y-4">
            {sorted.length === 0 ? (
              <p className="text-center text-gray-400 py-10">No politicians match this filter.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sorted.map((p, i) => (
                  <PoliticianCard
                    key={p.id}
                    politician={p}
                    rank={i + 1}
                    avgStars={3}
                  />
                ))}
              </div>
            )}
          </section>

          <footer className="text-xs text-gray-400 text-center pb-10 space-y-1">
            <p>
              Parliamentary data: Nepal Parliament public records · Poll data: Janamat ·
              Ratings: Solana devnet
            </p>
            <p>Program: DMmHWdzTeZwChv2uZbdqCDRECkP2WBQFttfY7xJYvVB5</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
