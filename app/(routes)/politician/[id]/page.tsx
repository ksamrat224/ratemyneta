"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/app/components/layout/Navbar";
import { RatingForm } from "@/app/components/politician/RatingForm";
import { politicians, getJanamatScore } from "@/app/data/politicians";
import { calcCompositeScore } from "@/app/data/scoring";
import { parties } from "@/app/data/parties";
import { usePoliticianRatings } from "@/app/lib/hooks/use-ratings";
import { useWallet } from "@/app/lib/wallet/context";
import { WalletButton } from "@/app/components/wallet-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

const AVATAR_GRADIENTS = [
  "from-red-400 to-rose-600",
  "from-blue-400 to-indigo-600",
  "from-emerald-400 to-teal-600",
  "from-violet-400 to-purple-600",
  "from-amber-400 to-orange-600",
  "from-cyan-400 to-sky-600",
  "from-pink-400 to-fuchsia-600",
];

function ScoreBadge({ score, grade }: { score: number; grade: string }) {
  return (
    <div className="relative flex flex-col items-center justify-center h-28 w-28 shrink-0">
      <svg viewBox="0 0 112 112" className="absolute inset-0 w-full h-full">
        <circle cx="56" cy="56" r="52" fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="6 3" />
        <circle cx="56" cy="56" r="46" fill="#dc2626" />
      </svg>
      <div className="relative z-10 flex flex-col items-center text-white leading-tight">
        <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">Score</span>
        <span className="text-3xl font-black">{Math.round(score)}%</span>
        <span className="text-[11px] font-bold">Grade {grade}</span>
      </div>
    </div>
  );
}

function TrendChart({ attendance, approval }: { attendance: number; approval: number }) {
  const months = ["JAN", "MAR", "MAY", "JUL", "SEP", "NOV"];
  const attPoints = [
    approval - 10, approval - 3, approval - 8,
    approval + 2, approval - 4, approval
  ].map(v => Math.max(5, Math.min(98, v)));

  const constPoints = [
    attendance - 5, attendance + 3, attendance - 2,
    attendance - 6, attendance + 4, attendance + 8
  ].map(v => Math.max(5, Math.min(98, v)));

  const W = 560, H = 200, PX = 40, PY = 20;
  const cW = W - PX * 2, cH = H - PY * 2 - 24;

  const getX = (i: number) => PX + (i / (months.length - 1)) * cW;
  const getY = (v: number) => PY + cH - (v / 100) * cH;

  const smoothPath = (pts: number[]) => {
    return pts.reduce((acc, v, i) => {
      const x = getX(i), y = getY(v);
      if (i === 0) return `M ${x} ${y}`;
      const px = getX(i - 1), py = getY(pts[i - 1]);
      const cpx = (px + x) / 2;
      return `${acc} C ${cpx} ${py} ${cpx} ${y} ${x} ${y}`;
    }, "");
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">Approval Rating Trend</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-[#dc2626] inline-block" />
            <span className="text-gray-500">Constituents</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-indigo-500 inline-block" />
            <span className="text-gray-500">Global Community</span>
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {[25, 50, 75].map(g => (
          <line key={g} x1={PX} x2={W - PX} y1={getY(g)} y2={getY(g)}
            stroke="#f3f4f6" strokeWidth={1} />
        ))}

        <path d={smoothPath(attPoints)} fill="none" stroke="#dc2626" strokeWidth={2.5} strokeLinecap="round" />
        <path d={smoothPath(constPoints)} fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" strokeDasharray="5 3" />

        {attPoints.map((v, i) => (
          <circle key={i} cx={getX(i)} cy={getY(v)} r={3.5} fill="white" stroke="#dc2626" strokeWidth={2} />
        ))}
        {constPoints.map((v, i) => (
          <circle key={i} cx={getX(i)} cy={getY(v)} r={3} fill="white" stroke="#6366f1" strokeWidth={1.5} />
        ))}

        {months.map((m, i) => (
          <text key={m} x={getX(i)} y={H - 4} textAnchor="middle"
            fontSize={10} fill="#9ca3af" fontWeight="600">{m}</text>
        ))}
      </svg>
    </div>
  );
}

function PerformanceBar({ label, value, color = "#dc2626" }: { label: string; value: number; color?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
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
  const initials = politician.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const gradientIdx = politician.name.charCodeAt(0) % AVATAR_GRADIENTS.length;
  const gradient = AVATAR_GRADIENTS[gradientIdx];
  const party = Object.values(parties).find(p => p.id === politician.partyId);
  const passRate = pd.billsProposed > 0 ? Math.round((pd.billsPassed / pd.billsProposed) * 100) : 0;

  // Derived performance metrics from real data
  const perfMetrics = [
    { label: "Attendance Record", value: pd.attendancePercent, color: "#dc2626" },
    { label: "Bill Pass Rate", value: passRate, color: "#6366f1" },
    { label: "Janamat Approval", value: Math.round(janamat), color: "#dc2626" },
    { label: "Community Rating", value: Math.round(avgStars * 20), color: "#6366f1" },
  ];

  // Simulated recent actions from parliamentary data
  const actions = [
    {
      date: "OCT 2024",
      title: `Attended ${pd.attendancePercent}% of Parliamentary Sessions`,
      desc: `Active participation across legislative sessions in ${politician.constituency} constituency.`,
      approval: Math.min(95, pd.attendancePercent + 5),
    },
    {
      date: "NOV 2024",
      title: `Proposed ${pd.billsProposed} Bills — ${pd.billsPassed} Passed`,
      desc: `Legislative contributions with a ${passRate}% pass rate during current term.`,
      approval: passRate,
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <main className="max-w-300 mx-auto px-4 py-10 space-y-6">

        {/* Hero */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row">

            {/* Photo / Avatar column */}
            <div className={`bg-linear-to-br ${gradient} md:w-72 h-56 md:h-auto flex items-center justify-center shrink-0`}>
              <div className="h-24 w-24 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white font-black text-4xl shadow-lg select-none">
                {initials}
              </div>
            </div>

            {/* Info column */}
            <div className="flex-1 p-8 relative">
              {/* Score badge — top right */}
              <div className="absolute top-6 right-6">
                <ScoreBadge score={composite} grade={grade} />
              </div>

              {/* Breadcrumb */}
              <div className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
                <Link href="/politicians" className="hover:text-[#dc2626] transition-colors">Politicians</Link>
                <span>/</span>
                <span>{politician.constituency}</span>
              </div>

              {/* Name */}
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight leading-tight pr-32">
                {politician.name}
              </h1>
              <p className="text-lg font-bold text-[#dc2626] italic mt-1">{politician.nameNepali}</p>

              {/* Bio */}
              <p className="text-sm text-gray-500 mt-4 leading-relaxed max-w-lg">
                Serving as {politician.role} for {politician.constituency} since {politician.electedYear}.
                Member of {politician.party}. Tracked on Solana with {averages ? averages.totalRatings : 0} on-chain citizen ratings.
              </p>

              {/* Pills */}
              <div className="flex flex-wrap gap-2 mt-5">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-700 bg-gray-50">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Active · {pd.billsProposed} Bills
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-700 bg-gray-50">
                  🏛 Party: {party?.shortName ?? politician.party}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-700 bg-gray-50">
                  Term: {pd.termStart.slice(0, 4)} → {pd.termEnd ?? "Present"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Trend + Performance */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-3">
            <TrendChart attendance={pd.attendancePercent} approval={Math.round(janamat)} />
          </div>

          <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-900">Performance Breakdown</h3>
            <div className="space-y-4">
              {perfMetrics.map((m) => (
                <PerformanceBar key={m.label} label={m.label} value={m.value} color={m.color} />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Objective</p>
                <p className="text-xl font-black text-gray-900">{Math.round(objective)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Community</p>
                <p className="text-xl font-black text-gray-900">{Math.round(community)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Legislative Actions */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">Recent Legislative Actions</h3>
            <button className="text-xs font-semibold text-[#dc2626] hover:underline">View Full Record</button>
          </div>
          <div className="divide-y divide-gray-100">
            {actions.map((a, i) => (
              <div key={i} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                <span className="text-[10px] font-bold text-gray-400 w-16 shrink-0 pt-0.5">{a.date}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 leading-snug">{a.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{a.desc}</p>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                  <span>{a.approval}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Community Ratings + Rating Form */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h3 className="font-bold text-gray-900">Community Ratings</h3>

          {averages ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Integrity", value: averages.integrity },
                { label: "Work Ethic", value: averages.workEthic },
                { label: "Promises Kept", value: averages.promisesKept },
                { label: "Overall", value: averages.overall },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-2xl font-black text-gray-900">
                    {item.value.toFixed(1)}<span className="text-xs text-gray-400 font-normal">/5</span>
                  </p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#dc2626] rounded-full" style={{ width: `${(item.value / 5) * 100}%` }} />
                  </div>
                </div>
              ))}
              <p className="col-span-2 md:col-span-4 text-xs text-gray-400 pt-2">
                Based on {averages.totalRatings} on-chain ratings verified on Solana
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No on-chain ratings yet — be the first!</p>
          )}

          <div className="border-t border-gray-100 pt-5">
            {status === "connected" ? (
              userHasRated ? (
                <p className="text-sm text-green-600 font-semibold">
                  ✓ You have already rated this politician. Updates allowed within 24h of submission.
                </p>
              ) : (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-gray-900">Submit Your Rating</h4>
                  <RatingForm onSubmit={submitRating} />
                </div>
              )
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-500">Connect your wallet to submit a rating</p>
                <WalletButton />
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-300 mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-[#dc2626] font-black text-sm">Rate My Politician</Link>
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
    </div>
  );
}
