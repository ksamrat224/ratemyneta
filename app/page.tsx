"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Navbar } from "./components/layout/Navbar";
import { politicians } from "./data/politicians";
import { parties } from "./data/parties";
import { calcCompositeScore } from "./data/scoring";
import { getJanamatScore as getScore } from "./data/politicians";

const TICKER_ITEMS = [
  "LIVE: Local Elections 2083 Polls Active",
  "SOLANA TX: 4A7s...93rP just recorded a sentiment update",
  "TRENDING: Kathmandu Mayor performance review up 14%",
  "LIVE: 2.4M+ verified votes recorded on-chain",
  "NEW: Rabi Lamichhane rating updated by 312 citizens",
];

const PARTY_HIGHLIGHT = [
  { id: "cpn_uml", badge: "HIGH ACTIVITY", badgeColor: "bg-green-500" },
  { id: "nc", badge: "NEUTRAL", badgeColor: "bg-gray-400" },
  { id: "cpn_mc", badge: "MONITORING", badgeColor: "bg-yellow-500" },
  { id: "rsn", badge: "RISING", badgeColor: "bg-blue-500" },
];

function avgAttendance(partyId: string): number {
  const members = politicians.filter((p) => p.partyId === partyId);
  if (!members.length) return 0;
  return Math.round(members.reduce((s, p) => s + p.parliamentData.attendancePercent, 0) / members.length);
}

function approvalPct(partyId: string): number {
  const members = politicians.filter((p) => p.partyId === partyId);
  if (!members.length) return 0;
  const avg = members.reduce((s, p) => s + calcCompositeScore(p.parliamentData.attendancePercent, p.parliamentData.billsProposed, p.parliamentData.billsPassed, getScore(p.id), 3).composite, 0) / members.length;
  return Math.round(avg);
}

const AVATAR_GRADIENTS = [
  ["#dc2626", "#991b1b"],
  ["#1d4ed8", "#1e40af"],
  ["#059669", "#065f46"],
  ["#7c3aed", "#5b21b6"],
  ["#d97706", "#92400e"],
];

function avatarGradient(name: string) {
  const i = name.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[i];
}

export default function Home() {
  const topThree = useMemo(() => {
    return [...politicians]
      .sort((a, b) => {
        const sA = calcCompositeScore(a.parliamentData.attendancePercent, a.parliamentData.billsProposed, a.parliamentData.billsPassed, getScore(a.id), 3);
        const sB = calcCompositeScore(b.parliamentData.attendancePercent, b.parliamentData.billsProposed, b.parliamentData.billsPassed, getScore(b.id), 3);
        return sB.composite - sA.composite;
      })
      .slice(0, 3);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans">
      <Navbar />

      {/* ── HERO ── */}
      <section
        className="relative min-h-[90vh] flex flex-col justify-end"
        style={{
          backgroundImage: "url('/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        {/* dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80" />

        <div className="relative z-10 max-w-400 mx-auto px-4 pb-14 w-full">
          {/* Badge */}
          <span className="inline-block bg-[#dc2626] text-white text-[11px] font-bold tracking-widest px-3 py-1 rounded mb-5 uppercase">
            On-Chain Governance
          </span>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl font-black text-white leading-tight max-w-2xl">
            Empower Your Voice in<br />Nepal&apos;s Democracy
          </h1>
          <p className="text-3xl md:text-4xl font-black text-white/90 mt-3 leading-snug">
            नेपालको लोकतन्त्रमा आफ्नो<br />आवाज बलियो बनाउनुहोस्
          </p>

          {/* Subtitle */}
          <p className="text-white/70 text-sm leading-relaxed mt-5 max-w-md">
            The first decentralized transparency platform for the Nepalese public. Track performance,
            rate politicians, and compare parties with immutable data on Solana.
          </p>

          {/* CTA buttons */}
          <div className="flex items-center gap-3 mt-7 flex-wrap">
            <Link
              href="/politicians"
              className="flex items-center gap-2 px-6 py-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold text-sm rounded-xl transition-colors"
            >
              Rate Your Leader
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </Link>
            <Link
              href="/how-it-works"
              className="flex items-center gap-2 px-6 py-3 border-2 border-white/60 hover:border-white text-white font-bold text-sm rounded-xl transition-colors"
            >
              View Live Polls
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-10 mt-10 flex-wrap">
            {[
              { val: "2.4M+", label: "VERIFIED VOTES" },
              { val: politicians.length.toString(), label: "TRACKED POLITICIANS" },
              { val: Object.keys(parties).length.toString(), label: "POLITICAL PARTIES" },
            ].map(({ val, label }) => (
              <div key={label}>
                <div className="text-white font-black text-2xl">{val}</div>
                <div className="text-white/50 text-[10px] font-semibold tracking-widest mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE TICKER ── */}
      <div className="bg-black text-white text-[11px] font-semibold overflow-hidden whitespace-nowrap py-2 relative">
        <div className="flex gap-12 animate-[ticker_30s_linear_infinite]" style={{ animation: "ticker 30s linear infinite" }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center gap-2 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-[#dc2626] shrink-0" />
              {item}
            </span>
          ))}
        </div>
        <style>{`
          @keyframes ticker {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>

      {/* ── POLITICAL PARTIES ── */}
      <section className="max-w-400 mx-auto px-4 py-14 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              Political Parties <span className="text-[#dc2626]">राजनीतिक दलहरू</span>
            </h2>
            <p className="text-gray-500 text-sm mt-1 max-w-md">
              Transparent metrics for major political organizations based on parliamentary records,
              attendance, and public sentiment.
            </p>
          </div>
          <Link href="/party" className="text-[#dc2626] text-sm font-semibold hover:underline shrink-0 mt-1">
            View All Parties →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PARTY_HIGHLIGHT.map(({ id, badge, badgeColor }) => {
            const party = parties[id];
            if (!party) return null;
            const att = avgAttendance(id);
            const approval = approvalPct(id);
            return (
              <Link href="/party" key={id}>
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all space-y-3">
                  {/* Logo + badge */}
                  <div className="flex items-start justify-between">
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-black text-sm border border-black/10"
                      style={{ backgroundColor: party.color }}
                    >
                      {party.shortName.slice(0, 3)}
                    </div>
                    <span className={`${badgeColor} text-white text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full uppercase`}>
                      {badge}
                    </span>
                  </div>

                  {/* Name */}
                  <div>
                    <div className="font-extrabold text-gray-900 text-sm leading-tight">{party.name}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{party.nameNepali}</div>
                  </div>

                  {/* Attendance bar */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Avg. Attendance</span>
                      <span className="font-bold text-[#dc2626]">{att}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#dc2626] rounded-full"
                        style={{ width: `${att}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">Seats</div>
                      <div className="font-black text-gray-900 text-base">{party.seats}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">Approval</div>
                      <div className="font-black text-gray-900 text-base">{approval}%</div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── PERFORMANCE SENTIMENT SPLIT ── */}
      <section className="max-w-400 mx-auto px-4 pb-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left: white card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-xl font-black text-gray-900">Real-time Performance Sentiment</h3>
              <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                Join over 2 million citizens recording their sentiment on policy decisions daily.
                All data is anchored on the Solana blockchain for complete auditability.
              </p>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-6">
              <div>
                <div className="text-[#dc2626] font-black text-2xl">12k</div>
                <div className="text-gray-400 text-[10px] font-semibold tracking-widest uppercase">Hourly Votes</div>
              </div>
              <div>
                <div className="text-[#4f46e5] font-black text-2xl">100%</div>
                <div className="text-gray-400 text-[10px] font-semibold tracking-widest uppercase">Verified Records</div>
              </div>
            </div>

            {/* Mini trend chart */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span className="font-semibold">TREND LINE</span>
                <span className="text-green-600 font-bold">+12.4%</span>
              </div>
              <div className="flex items-end gap-1.5 h-16">
                {[40, 55, 45, 60, 52, 70, 65, 80].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t"
                    style={{
                      height: `${h}%`,
                      background: i === 7 ? "#dc2626" : `rgba(220,38,38,${0.15 + i * 0.08})`,
                    }}
                  />
                ))}
              </div>
              <Link
                href="/politicians"
                className="block w-full text-center py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm font-bold rounded-lg transition-colors"
              >
                Engage Now
              </Link>
            </div>
          </div>

          {/* Right: red card */}
          <div
            className="rounded-2xl p-6 flex flex-col justify-between space-y-6"
            style={{ background: "linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)" }}
          >
            <div className="space-y-4">
              {/* Shield icon */}
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">Immutable &amp; Unbiased</h3>
                <p className="text-white/70 text-sm mt-2 leading-relaxed">
                  Rate My Politician uses decentralized identity to prevent bot manipulation, ensuring
                  one voice per verified citizen. Every rating is immutable and publicly auditable.
                </p>
              </div>
            </div>

            <Link href="/how-it-works" className="text-white font-semibold text-sm hover:text-white/80 transition-colors">
              Learn more about Solana →
            </Link>
          </div>
        </div>
      </section>

      {/* ── TOP RATED REPRESENTATIVES ── */}
      <section className="max-w-400 mx-auto px-4 pb-16 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-gray-900">Top Rated Representatives</h2>
          <p className="text-gray-500 text-sm">
            Citizens&apos; monthly ranking based on legislative impact and local responsiveness.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {topThree.map((p) => {
            const [from, to] = avatarGradient(p.name);
            const sc = calcCompositeScore(
              p.parliamentData.attendancePercent,
              p.parliamentData.billsProposed,
              p.parliamentData.billsPassed,
              getScore(p.id),
              3
            );
            const stars = Math.round((sc.composite / 100) * 5 * 10) / 10;
            return (
              <Link href={`/politician/${p.id}`} key={p.id}>
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#dc2626]/40 transition-all flex items-center gap-4 group">
                  {/* Avatar */}
                  <div
                    className="h-14 w-14 rounded-xl shrink-0 flex items-center justify-center font-black text-white text-xl"
                    style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                  >
                    {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-gray-900 text-sm truncate">{p.name}</div>
                    <div className="text-gray-500 text-xs truncate">{p.role}</div>
                    <div className="text-gray-400 text-xs truncate">{p.constituency}</div>
                    {/* Stars */}
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs font-bold text-gray-700">{stars.toFixed(1)}/5.0</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <svg key={s} className={`h-3 w-3 ${s <= Math.round(stars) ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <svg className="h-4 w-4 text-gray-300 group-hover:text-[#dc2626] transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center pt-2">
          <Link
            href="/politicians"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-[#dc2626] text-[#dc2626] font-bold text-sm hover:bg-[#dc2626] hover:text-white transition-colors"
          >
            View All Politicians →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-200 bg-white">
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
