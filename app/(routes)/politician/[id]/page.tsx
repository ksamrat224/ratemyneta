"use client";

import { use, useState } from "react";
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

function TrendChart({ attendance, approval }: { attendance: number; approval: number }) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const attPoints = [
    attendance - 6,
    attendance - 2,
    attendance - 4,
    attendance,
    attendance + 2,
    attendance
  ].map(v => Math.max(10, Math.min(100, v)));
  
  const appPoints = [
    approval - 8,
    approval - 5,
    approval - 2,
    approval + 3,
    approval - 1,
    approval
  ].map(v => Math.max(10, Math.min(100, v)));

  const width = 500;
  const height = 180;
  const padding = 30;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const getY = (val: number) => {
    return padding + chartHeight - (val / 100) * chartHeight;
  };

  const getX = (idx: number) => {
    return padding + (idx / (months.length - 1)) * chartWidth;
  };

  const buildPath = (points: number[]) => {
    return points.reduce((path, val, idx) => {
      const x = getX(idx);
      const y = getY(val);
      return path + `${idx === 0 ? "M" : " L"} ${x} ${y}`;
    }, "");
  };

  const attPath = buildPath(attPoints);
  const appPath = buildPath(appPoints);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/60 p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-base text-gray-900 dark:text-white">Performance Trends</h3>
        
        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#dc2626]" />
            <span className="text-gray-500 dark:text-gray-400">Attendance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#8b5cf6]" />
            <span className="text-gray-500 dark:text-gray-400">Janamat Approval</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[400px] h-auto overflow-visible">
          {/* Y Axis Grid Lines */}
          {[0, 25, 50, 75, 100].map((gridVal) => {
            const y = getY(gridVal);
            return (
              <g key={gridVal} className="opacity-10 dark:opacity-20 text-gray-400 dark:text-gray-500">
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <text
                  x={padding - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] font-bold fill-current"
                >
                  {gridVal}%
                </text>
              </g>
            );
          })}

          {/* X Axis Labels */}
          {months.map((m, idx) => {
            const x = getX(idx);
            return (
              <text
                key={m}
                x={x}
                y={height - padding + 18}
                textAnchor="middle"
                className="text-[9px] font-black fill-current text-gray-400 dark:text-gray-500"
              >
                {m}
              </text>
            );
          })}

          {/* Attendance Line */}
          <path
            d={attPath}
            fill="none"
            stroke="#dc2626"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {attPoints.map((val, idx) => (
            <circle
              key={`att-dot-${idx}`}
              cx={getX(idx)}
              cy={getY(val)}
              r={3.5}
              className="fill-white dark:fill-gray-800 stroke-[#dc2626]"
              strokeWidth={2}
            />
          ))}

          {/* Approval Line */}
          <path
            d={appPath}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {appPoints.map((val, idx) => (
            <circle
              key={`app-dot-${idx}`}
              cx={getX(idx)}
              cy={getY(val)}
              r={3.5}
              className="fill-white dark:fill-gray-800 stroke-[#8b5cf6]"
              strokeWidth={2}
            />
          ))}
        </svg>
      </div>
    </div>
  );
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
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Header card */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/60 p-6 shadow-xs">
          <div className="flex items-start gap-6 flex-wrap">
            <div className="h-20 w-20 rounded-2xl bg-red-50 dark:bg-slate-700 flex items-center justify-center text-[#dc2626] dark:text-red-400 font-black text-3xl shrink-0 border border-red-100 dark:border-gray-600">
              {initials}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white leading-tight font-sans">
                  {politician.nameNepali}
                </h1>
                <PartyBadge partyId={politician.partyId} />
              </div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{politician.name}</p>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 pt-1">
                {politician.role} · {politician.constituency} · Elected {politician.electedYear}
              </p>
            </div>
            <ScoreRing score={composite} grade={grade} size={96} />
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700/50 flex gap-6 text-xs flex-wrap font-bold text-gray-500 dark:text-gray-400">
            <div>
              <span className="text-gray-400">Objective Score</span>
              <span className="ml-2 font-black text-gray-800 dark:text-gray-200">{Math.round(objective)}/100</span>
            </div>
            <div>
              <span className="text-gray-400">Community Score</span>
              <span className="ml-2 font-black text-gray-800 dark:text-gray-200">{Math.round(community)}/100</span>
            </div>
            <div>
              <span className="text-gray-400">Janamat Approval</span>
              <span className="ml-2 font-black text-gray-800 dark:text-gray-200">{Math.round(janamat)}%</span>
            </div>
          </div>
        </section>

        {/* Two column layout for parliamentary & trends */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Parliamentary record */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/60 p-6 space-y-4 shadow-xs">
            <h2 className="font-extrabold text-lg text-gray-900 dark:text-white">Parliamentary Record</h2>
            <div className="space-y-4 text-xs font-bold text-gray-500 dark:text-gray-400">
              <div className="space-y-1">
                <p className="text-gray-400">Attendance</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#dc2626] rounded-full"
                      style={{ width: `${pd.attendancePercent}%` }}
                    />
                  </div>
                  <span className="font-black text-gray-850 dark:text-gray-200">{pd.attendancePercent}%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="space-y-0.5 bg-gray-50 dark:bg-gray-900/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800/40">
                  <p className="text-[10px] text-gray-400">Proposed</p>
                  <p className="text-xl font-black text-gray-800 dark:text-gray-200">{pd.billsProposed}</p>
                </div>
                <div className="space-y-0.5 bg-gray-50 dark:bg-gray-900/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800/40">
                  <p className="text-[10px] text-gray-400">Passed</p>
                  <p className="text-xl font-black text-[#dc2626]">{pd.billsPassed}</p>
                </div>
                <div className="space-y-0.5 bg-gray-50 dark:bg-gray-900/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800/40">
                  <p className="text-[10px] text-gray-400">Pass Rate</p>
                  <p className="text-xl font-black text-[#8b5cf6]">
                    {pd.billsProposed > 0
                      ? Math.round((pd.billsPassed / pd.billsProposed) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 pt-2">
              Term: {pd.termStart} → {pd.termEnd ?? "Present"}
            </p>
          </section>

          {/* Trend Chart Card */}
          <TrendChart attendance={pd.attendancePercent} approval={janamat} />
        </div>

        {/* Community ratings */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/60 p-6 space-y-4 shadow-xs">
          <h2 className="font-extrabold text-lg text-gray-900 dark:text-white">Community Ratings</h2>
          {averages ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-gray-500 dark:text-gray-400">
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
                  <p className="text-lg font-black text-gray-800 dark:text-gray-200">{item.value.toFixed(1)}<span className="text-gray-400 text-xs">/5</span></p>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#dc2626] rounded-full"
                      style={{ width: `${(item.value / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="col-span-2 md:col-span-4 text-[10px] text-gray-400 pt-2">
                Based on {averages.totalRatings} on-chain ratings verified on Solana
              </p>
            </div>
          ) : (
            <p className="text-gray-400 italic text-xs">Be the first to rate this politician!</p>
          )}

          {/* Rating form */}
          {status === "connected" ? (
            userHasRated ? (
              <p className="text-xs text-green-600 dark:text-green-400 font-bold pt-2">
                ✓ You have already rated this politician. Ratings can be updated within 24h.
              </p>
            ) : (
              <div className="border-t border-gray-100 dark:border-gray-700/50 pt-5 space-y-3">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">Submit Your Rating</h3>
                <RatingForm onSubmit={submitRating} />
              </div>
            )
          ) : (
            <div className="border-t border-gray-100 dark:border-gray-700/50 pt-5 flex items-center gap-3 flex-wrap">
              <p className="text-xs text-gray-500 font-bold">Connect wallet to submit a rating</p>
              <WalletButton />
            </div>
          )}
        </section>

        {/* Janamat polls */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/60 p-6 space-y-4 shadow-xs">
          <h2 className="font-extrabold text-lg text-gray-900 dark:text-white">Janamat Public Opinion</h2>
          <JanamatPollList pollIds={politician.relatedPollIds} />
        </section>
      </main>
    </div>
  );
}
