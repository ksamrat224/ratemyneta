"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { Navbar } from "@/app/components/layout/Navbar";
import { ScoreRing } from "@/app/components/politician/ScoreRing";
import { PartyBadge } from "@/app/components/politician/PartyBadge";
import { RatingForm } from "@/app/components/politician/RatingForm";
import { JanamatPollList } from "@/app/components/politician/JanamatPollList";
import { politicians, getJanamatScore } from "@/app/data/politicians";
import { calcCompositeScore } from "@/app/data/scoring";
import { usePoliticianRatings } from "@/app/lib/hooks/use-ratings";
import { useWallet } from "@/app/lib/wallet/context";
import { WalletButton } from "@/app/components/wallet-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PoliticianPage({ params }: PageProps) {
  const { id } = use(params);
  const politician = politicians.find((p) => p.id === id);
  if (!politician) notFound();

  const { status } = useWallet();
  const { averages, userHasRated, submitRating } = usePoliticianRatings(id);

  const janamat = getJanamatScore(id);
  const avgStars = averages
    ? (averages.integrity + averages.workEthic + averages.promisesKept + averages.overall) / 4
    : 3;
  const { composite, grade, objective, community } = calcCompositeScore(
    politician.parliamentData.attendancePercent,
    politician.parliamentData.billsProposed,
    politician.parliamentData.billsPassed,
    janamat,
    avgStars
  );

  const pd = politician.parliamentData;
  const initials = politician.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Header card */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start gap-6 flex-wrap">
            <div className="h-20 w-20 rounded-2xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-black text-2xl shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black">{politician.name}</h1>
                <PartyBadge partyId={politician.partyId} />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">{politician.nameNepali}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {politician.role} · {politician.constituency} · Elected {politician.electedYear}
              </p>
            </div>
            <ScoreRing score={composite} grade={grade} size={96} />
          </div>

          <div className="mt-4 flex gap-6 text-sm flex-wrap">
            <div>
              <span className="text-gray-400">Objective Score</span>
              <span className="ml-2 font-semibold">{Math.round(objective)}/100</span>
            </div>
            <div>
              <span className="text-gray-400">Community Score</span>
              <span className="ml-2 font-semibold">{Math.round(community)}/100</span>
            </div>
            <div>
              <span className="text-gray-400">Janamat Approval</span>
              <span className="ml-2 font-semibold">{Math.round(janamat)}%</span>
            </div>
          </div>
        </section>

        {/* Parliamentary record */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="font-bold text-lg">Parliamentary Record</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-gray-400">Attendance</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${pd.attendancePercent}%` }}
                  />
                </div>
                <span className="font-semibold">{pd.attendancePercent}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-gray-400">Bills Proposed</p>
              <p className="text-2xl font-bold">{pd.billsProposed}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-400">Bills Passed</p>
              <p className="text-2xl font-bold">{pd.billsPassed}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-400">Pass Rate</p>
              <p className="text-2xl font-bold">
                {pd.billsProposed > 0
                  ? Math.round((pd.billsPassed / pd.billsProposed) * 100)
                  : 0}%
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Term: {pd.termStart} → {pd.termEnd ?? "Present"}
          </p>
        </section>

        {/* Community ratings */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="font-bold text-lg">Community Ratings</h2>
          {averages ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {(
                [
                  { label: "Integrity", value: averages.integrity },
                  { label: "Work Ethic", value: averages.workEthic },
                  { label: "Promises Kept", value: averages.promisesKept },
                  { label: "Overall", value: averages.overall },
                ] as const
              ).map((item) => (
                <div key={item.label} className="space-y-1">
                  <p className="text-gray-400">{item.label}</p>
                  <p className="text-xl font-bold">{item.value.toFixed(1)}<span className="text-gray-400 text-sm">/5</span></p>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${(item.value / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="col-span-2 md:col-span-4 text-xs text-gray-400">
                Based on {averages.totalRatings} on-chain ratings
              </p>
            </div>
          ) : (
            <p className="text-gray-400 italic">Be the first to rate this politician!</p>
          )}

          {/* Rating form */}
          {status === "connected" ? (
            userHasRated ? (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                ✓ You have already rated this politician. Ratings can be updated within 24h.
              </p>
            ) : (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                <h3 className="font-semibold text-sm">Submit Your Rating</h3>
                <RatingForm onSubmit={submitRating} />
              </div>
            )
          ) : (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex items-center gap-3">
              <p className="text-sm text-gray-500">Connect wallet to submit a rating</p>
              <WalletButton />
            </div>
          )}
        </section>

        {/* Janamat polls */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="font-bold text-lg">Janamat Public Opinion</h2>
          <JanamatPollList pollIds={politician.relatedPollIds} />
        </section>
      </main>
    </div>
  );
}
