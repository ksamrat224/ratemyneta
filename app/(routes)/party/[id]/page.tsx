"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/app/components/layout/Navbar";
import { PartyRatingForm } from "@/app/components/party/PartyRatingForm";
import { parties } from "@/app/data/parties";
import { politicians } from "@/app/data/politicians";
import { calcCompositeScore, getGrade } from "@/app/data/scoring";
import { getJanamatScore } from "@/app/data/politicians";
import { usePartyRatings } from "@/app/lib/hooks/use-party-ratings";
import { useZkPartyRating } from "@/app/lib/hooks/use-zk-rating";
import { useWallet } from "@/app/lib/wallet/context";
import { WalletButton } from "@/app/components/wallet-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

// ── Static enriched data per party ───────────────────────────────────────────

type AchievementStatus = "Completed" | "In Progress" | "Planned";

interface Achievement {
  status: AchievementStatus;
  date: string;
  title: string;
  description: string;
}

type ControversyStatus = "PENDING INVESTIGATION" | "RESOLVED" | "IN COURT" | "CASE CLOSED";

interface Controversy {
  date: string;
  status: ControversyStatus;
  title: string;
  description: string;
  linkLabel: string;
}

interface PartyDetail {
  bio: string;
  president?: string;
  ideology: string[];
  approvalRating: number;
  billsSponsored: number;
  billsPassed: number;
  attendanceByMonth: number[];   // 6 values, JAN–JUN
  achievements: Achievement[];
  controversies: Controversy[];
}

const PARTY_DETAILS: Record<string, PartyDetail> = {
  cpn_uml: {
    bio: "Communist Party of Nepal (Unified Marxist-Leninist). Currently the major opposition party, focusing on 'Prosperous Nepal, Happy Nepali' through democratic centralism and social justice initiatives.",
    president: "K.P. Sharma Oli",
    ideology: ["Democratic Centralism", "Social Justice", "Nationalism"],
    approvalRating: 72,
    billsSponsored: 42,
    billsPassed: 12,
    attendanceByMonth: [74, 80, 88, 76, 82, 91],
    achievements: [
      { status: "Completed", date: "Nov 2023", title: "Social Security Expansion", description: "Successfully passed the amendment bill to increase the universal basic income for senior citizens and expanded health insurance coverage to 25 additional districts." },
      { status: "In Progress", date: "Ongoing", title: "Infrastructure Development Initiatives", description: "Overseeing the mid-hill highway project completion status. Currently holding public hearings to resolve land acquisition disputes in the eastern sector." },
      { status: "Completed", date: "Mar 2023", title: "Agricultural Subsidy Reform", description: "Implemented a direct-to-bank transfer system for fertilizer subsidies, reducing administrative leakage by an estimated 14% based on the latest audit." },
    ],
    controversies: [
      { date: "AUG 2023", status: "PENDING INVESTIGATION", title: "Contract Bidding Allegations", description: "Questions raised over the selection process of the Bagmati Corridor project. Allegations of preferential treatment for affiliated firms.", linkLabel: "VIEW SOURCE AUDIT" },
      { date: "JAN 2023", status: "RESOLVED", title: "Inter-party Committee Funding", description: "Discrepancy in the reporting of campaign donations during local elections. The party issued a formal correction following the Election Commission's inquiry.", linkLabel: "CASE CLOSED" },
      { date: "NOV 2022", status: "IN COURT", title: "Land Use Policy Conflict", description: "Supreme Court review regarding the constitutionality of the proposed Land Acquisition Act Amendment backed by UML leadership.", linkLabel: "IN COURT" },
    ],
  },
  nc: {
    bio: "Nepal's oldest democratic party founded in 1947. Advocates for liberal democracy, social democracy, and a mixed economy. Currently the largest party in parliament.",
    president: "Sher Bahadur Deuba",
    ideology: ["Liberal Democracy", "Social Democracy", "Mixed Economy"],
    approvalRating: 59,
    billsSponsored: 55,
    billsPassed: 18,
    attendanceByMonth: [80, 85, 82, 78, 83, 87],
    achievements: [
      { status: "Completed", date: "Jun 2023", title: "Federal Health Infrastructure Bill", description: "Passed landmark legislation expanding federal health infrastructure to 45 rural municipalities, improving access for over 2 million citizens." },
      { status: "In Progress", date: "Ongoing", title: "Education Reform Initiative", description: "Rolling out a national curriculum reform to modernize secondary school education and strengthen technical and vocational training pathways." },
      { status: "Completed", date: "Jan 2023", title: "Climate Adaptation Fund", description: "Secured NPR 3.2 billion in climate adaptation financing for flood-prone districts in the Terai through multilateral negotiations." },
    ],
    controversies: [
      { date: "SEP 2023", status: "PENDING INVESTIGATION", title: "Lalita Niwas Land Grab", description: "CIAA investigation into alleged irregularities in state-owned land transfer in Baluwatar involving senior NC-linked officials.", linkLabel: "VIEW SOURCE AUDIT" },
      { date: "MAY 2023", status: "IN COURT", title: "Procurement Irregularities", description: "Supreme Court has taken up a PIL challenging the selection process of a road construction contractor in Madhesh Province.", linkLabel: "IN COURT" },
      { date: "DEC 2022", status: "RESOLVED", title: "Party Fund Disclosures", description: "Election Commission flagged underreported donor contributions in the 2022 election cycle. NC submitted a corrected disclosure.", linkLabel: "CASE CLOSED" },
    ],
  },
  cpn_mc: {
    bio: "Founded in 1994 as the Communist Party of Nepal (Maoist). Led the decade-long People's War. Now a parliamentary left party advocating for federalism, inclusion, and socialist reforms.",
    president: "Pushpa Kamal Dahal",
    ideology: ["Left Nationalism", "Federalism", "Inclusion"],
    approvalRating: 42,
    billsSponsored: 28,
    billsPassed: 7,
    attendanceByMonth: [68, 72, 75, 70, 74, 78],
    achievements: [
      { status: "Completed", date: "Apr 2023", title: "Dalits Rights Legislation", description: "Passed the Caste Discrimination Prohibition and Punishment Act amendment strengthening penalties and establishing a dedicated fast-track court." },
      { status: "In Progress", date: "Ongoing", title: "Provincial Autonomy Strengthening", description: "Pushing for constitutional amendments to devolve greater fiscal authority to provincial governments under the federal structure." },
    ],
    controversies: [
      { date: "OCT 2023", status: "PENDING INVESTIGATION", title: "Cooperative Scandal Involvement", description: "Multiple Maoist-affiliated leaders implicated in the nationwide cooperative fraud affecting over 150,000 depositors.", linkLabel: "VIEW SOURCE AUDIT" },
      { date: "JUN 2023", status: "IN COURT", title: "Transitional Justice Delay", description: "Supreme Court directed the government to fast-track transitional justice mechanisms following allegations of political interference.", linkLabel: "IN COURT" },
    ],
  },
  rsn: {
    bio: "Founded in 2022 ahead of the parliamentary elections, Rastriya Swatantra Party emerged as a reformist force attracting young voters. Advocates for clean governance, anti-corruption, and meritocracy.",
    president: "Rabi Lamichhane",
    ideology: ["Anti-corruption", "Meritocracy", "Reform", "Youth Empowerment"],
    approvalRating: 78,
    billsSponsored: 18,
    billsPassed: 5,
    attendanceByMonth: [88, 91, 90, 85, 92, 94],
    achievements: [
      { status: "Completed", date: "Aug 2023", title: "Anti-Corruption Private Member Bill", description: "Successfully introduced the Whistleblower Protection Bill to parliament, advancing it through committee stage with cross-party support." },
      { status: "In Progress", date: "Ongoing", title: "Public Procurement Transparency", description: "Advocating for mandatory e-procurement and public audit for all contracts above NPR 5 million at local government level." },
    ],
    controversies: [
      { date: "SEP 2023", status: "PENDING INVESTIGATION", title: "Leadership Passport Irregularity", description: "CIAA opened a preliminary inquiry into allegations related to Rabi Lamichhane's U.S. citizenship renunciation process.", linkLabel: "VIEW SOURCE AUDIT" },
    ],
  },
  rpp: {
    bio: "Rastriya Prajatantra Party advocates for constitutional monarchy and Hindu state restoration. Primarily draws support from conservative voters and former royal establishment figures.",
    president: "Rajendra Lingden",
    ideology: ["Constitutional Monarchy", "Hindu State", "Conservatism"],
    approvalRating: 38,
    billsSponsored: 10,
    billsPassed: 2,
    attendanceByMonth: [70, 72, 68, 74, 71, 75],
    achievements: [
      { status: "Completed", date: "Mar 2023", title: "Religious Tourism Promotion Bill", description: "Passed a resolution promoting religious tourism corridors linking major Hindu pilgrimage sites across Nepal." },
    ],
    controversies: [
      { date: "JUL 2023", status: "RESOLVED", title: "Campaign Finance Query", description: "Election Commission queried sources of political rally funding during 2022 campaigns. RPP submitted required documentation.", linkLabel: "CASE CLOSED" },
    ],
  },
  janmat: {
    bio: "Janmat Party was founded ahead of the 2022 elections primarily representing the Madhesh region and marginalised communities. Focuses on federalism, inclusion, and Madhesi rights.",
    president: "C.K. Raut",
    ideology: ["Federalism", "Madhesi Rights", "Inclusion"],
    approvalRating: 55,
    billsSponsored: 8,
    billsPassed: 2,
    attendanceByMonth: [72, 76, 74, 70, 78, 80],
    achievements: [
      { status: "In Progress", date: "Ongoing", title: "Madhesh Province Resource Rights Bill", description: "Pushing for greater fiscal and natural resource rights for Province 2, including revenue sharing from border customs." },
    ],
    controversies: [],
  },
};

const MONTHS_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"];

const CONTROVERSY_STATUS_STYLE: Record<ControversyStatus, { badge: string; link: string }> = {
  "PENDING INVESTIGATION": { badge: "text-orange-600 border-orange-300 bg-orange-50", link: "text-orange-600 hover:text-orange-800" },
  "RESOLVED":              { badge: "text-green-600 border-green-300 bg-green-50",   link: "text-green-600 hover:text-green-800" },
  "IN COURT":              { badge: "text-blue-600 border-blue-300 bg-blue-50",       link: "text-blue-600 hover:text-blue-800" },
  "CASE CLOSED":           { badge: "text-gray-500 border-gray-300 bg-gray-50",       link: "text-gray-500 hover:text-gray-700" },
};

const ACHIEVEMENT_STATUS_STYLE: Record<AchievementStatus, string> = {
  "Completed":   "bg-gray-100 text-gray-600",
  "In Progress": "bg-blue-100 text-blue-600",
  "Planned":     "bg-yellow-100 text-yellow-600",
};

function gradeColor(grade: string) {
  if (grade.startsWith("A")) return "#16a34a";
  if (grade.startsWith("B")) return "#2563eb";
  if (grade.startsWith("C")) return "#d97706";
  return "#dc2626";
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PartyDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const party = parties[id];
  if (!party || id === "independent") notFound();

  const { status } = useWallet();
  const { averages, userHasRated, submitRating } = usePartyRatings(id);
  const { zkSupported, submitAnonymous } = useZkPartyRating(id);

  const detail = PARTY_DETAILS[id] ?? {
    bio: `${party.name} is a registered political party in Nepal.`,
    ideology: [],
    approvalRating: 50,
    billsSponsored: 0,
    billsPassed: 0,
    attendanceByMonth: [70, 72, 74, 73, 75, 76],
    achievements: [],
    controversies: [],
  };

  const members = politicians.filter((p) => p.partyId === id);
  const avgAttendance =
    members.length > 0
      ? Math.round(members.reduce((s, p) => s + p.parliamentData.attendancePercent, 0) / members.length)
      : 0;

  const avgScore =
    members.length > 0
      ? members.reduce((s, p) => {
          const { composite } = calcCompositeScore(
            p.parliamentData.attendancePercent,
            p.parliamentData.billsProposed,
            p.parliamentData.billsPassed,
            getJanamatScore(p.id),
            3
          );
          return s + composite;
        }, 0) / members.length
      : 50;

  const grade = getGrade(avgScore);
  const gColor = gradeColor(grade);

  const billSuccessRate =
    detail.billsSponsored > 0
      ? ((detail.billsPassed / detail.billsSponsored) * 100).toFixed(1)
      : "0.0";

  const maxAttendance = Math.max(...detail.attendanceByMonth, 1);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <main className="max-w-400 mx-auto px-4 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Link href="/party" className="hover:text-[#dc2626] transition-colors">Parties</Link>
          <span>/</span>
          <span className="text-gray-600 font-medium">{party.name}</span>
        </div>

        {/* ── Hero card ─────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          {/* Watermark parliament icon */}
          <svg className="absolute right-6 top-4 h-32 w-32 text-gray-100" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7v1h20V7L12 2zM3 9v9H1v2h22v-2h-2V9H3zm4 0v9H5V9h2zm4 0v9H9V9h2zm4 0v9h-2V9h2zm4 0v9h-2V9h2zM12 3.5l7 3.5H5l7-3.5z"/>
          </svg>

          <div className="flex items-start gap-5 relative z-10">
            {/* Logo */}
            <div
              className="h-28 w-28 rounded-xl border border-black/10 flex items-center justify-center text-white font-black text-2xl shrink-0"
              style={{ backgroundColor: party.color }}
            >
              {party.shortName.slice(0, 3)}
            </div>

            {/* Name + bio */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-gray-900">{party.name}</h1>
                <span className="text-xl font-black text-[#dc2626]">{party.nameNepali}</span>
              </div>

              {detail.president && (
                <p className="text-xs text-gray-400 mt-0.5 font-medium">President: {detail.president}</p>
              )}

              <p className="text-gray-500 text-sm leading-relaxed mt-2 max-w-2xl">{detail.bio}</p>

              {/* Ideology pills */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {detail.ideology.map((tag) => (
                  <span key={tag} className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-gray-300 text-gray-500 bg-gray-50">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── 4 stat cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="border border-gray-200 rounded-xl p-4 text-center bg-gray-50">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Total Seats</div>
              <div className="text-2xl font-black text-gray-900">
                {party.seats} <span className="text-base font-semibold text-gray-400">/ 275</span>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-4 text-center bg-gray-50">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Approval Rating</div>
              <div className="text-2xl font-black" style={{ color: detail.approvalRating >= 60 ? "#16a34a" : detail.approvalRating >= 40 ? "#d97706" : "#dc2626" }}>
                {detail.approvalRating}%
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-4 text-center bg-gray-50">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Avg. Attendance</div>
              <div className="text-2xl font-black text-gray-900">{avgAttendance}%</div>
            </div>

            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: gColor }}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">Integrity Grade</div>
              <div className="text-4xl font-black text-white">{grade}</div>
            </div>
          </div>
        </div>

        {/* ── Body: left 2/3 + right 1/3 ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-5">

            {/* Achievements */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-extrabold text-gray-900 text-sm">
                  <span className="text-[#dc2626]">प्रगति र उपलब्धिहरू</span>{" "}
                  <span className="text-gray-400 font-medium">/ Achievements</span>
                </h2>
                <button className="text-[#dc2626] text-xs font-semibold hover:underline cursor-pointer">View All</button>
              </div>

              <div className="divide-y divide-gray-50">
                {detail.achievements.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-10">No achievements recorded yet.</p>
                ) : (
                  detail.achievements.map((a, i) => (
                    <div key={i} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${ACHIEVEMENT_STATUS_STYLE[a.status]}`}>
                          {a.status}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">{a.date}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">{a.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed mt-1">{a.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Legislative Performance */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-extrabold text-gray-900 text-sm">
                  <span className="text-[#dc2626]">विधायकी प्रदर्शन</span>{" "}
                  <span className="text-gray-400 font-medium">/ Legislative Performance</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5">
                {/* Attendance bar chart */}
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Attendance Trends (Last 6 Months)
                  </div>
                  <div className="flex items-end gap-2 h-24">
                    {detail.attendanceByMonth.map((val, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t"
                          style={{
                            height: `${(val / maxAttendance) * 96}px`,
                            background: i === detail.attendanceByMonth.length - 1
                              ? "#dc2626"
                              : `rgba(220,38,38,${0.2 + (i / detail.attendanceByMonth.length) * 0.5})`,
                          }}
                        />
                        <span className="text-[8px] text-gray-400 font-semibold">{MONTHS_SHORT[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bills sponsored vs passed */}
                <div className="border border-gray-200 rounded-xl p-4 space-y-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Bills: Sponsored vs Passed
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-600 font-medium">Sponsored</span>
                        <span className="font-bold text-gray-900">{detail.billsSponsored} Bills</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: "100%" }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-600 font-medium">Passed / Enacted</span>
                        <span className="font-bold text-gray-900">{detail.billsPassed} Bills</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#dc2626] rounded-full"
                          style={{ width: `${detail.billsSponsored > 0 ? (detail.billsPassed / detail.billsSponsored) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 pt-1 border-t border-gray-100">
                    Success rate:{" "}
                    <span className="font-bold text-gray-800">{billSuccessRate}%</span>{" "}
                    <span className="text-gray-400">(Industry Avg: 22%)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT sidebar */}
          <div className="space-y-5">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-[#dc2626] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div>
                    <div className="text-xs font-black text-gray-900 uppercase tracking-wider">Public Record &amp; Oversight</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">सार्वजनिक रेकर्ड र निरीक्षण — An objective, data-driven log of party conduct.</div>
                  </div>
                </div>
              </div>

              {/* Notable controversies */}
              <div className="px-5 pt-4 pb-2">
                <div className="flex items-center gap-1.5 mb-3">
                  <svg className="h-3.5 w-3.5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">Notable Controversies</span>
                </div>

                {detail.controversies.length === 0 ? (
                  <p className="text-xs text-gray-400 pb-4 text-center py-6">No recorded controversies.</p>
                ) : (
                  <div className="space-y-4 pb-2">
                    {detail.controversies.map((c, i) => {
                      const style = CONTROVERSY_STATUS_STYLE[c.status];
                      return (
                        <div key={i} className={`rounded-xl border p-3.5 space-y-2 ${i < detail.controversies.length - 1 ? "mb-0" : ""}`}
                          style={{ borderColor: "#e5e7eb" }}>
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${style.badge}`}>
                              {c.status}
                            </span>
                            <span className="text-[10px] text-gray-400 font-semibold shrink-0">{c.date}</span>
                          </div>
                          <h3 className="text-xs font-bold text-gray-900 leading-snug">{c.title}</h3>
                          <p className="text-[11px] text-gray-500 leading-relaxed">{c.description}</p>
                          <button className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${style.link} transition-colors cursor-pointer`}>
                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            {c.linkLabel}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Download button */}
              <div className="px-5 pb-5">
                <button className="w-full py-2.5 rounded-xl border-2 border-gray-200 text-xs font-bold text-gray-600 hover:border-[#dc2626] hover:text-[#dc2626] transition-colors cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Integrity Report (PDF)
                </button>
              </div>
            </div>

            {/* Member MPs quick list */}
            {members.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-700">Tracked Members</h3>
                  <Link href={`/politicians`} className="text-[#dc2626] text-[10px] font-semibold hover:underline">
                    View All →
                  </Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {members.slice(0, 4).map((p) => (
                    <Link key={p.id} href={`/politician/${p.id}`}>
                      <div className="px-5 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center text-white text-[10px] font-black"
                          style={{ background: `linear-gradient(135deg, ${party.color}, ${party.color}99)` }}
                        >
                          {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-gray-900 truncate">{p.name}</div>
                          <div className="text-[10px] text-gray-400 truncate">{p.role} · {p.constituency}</div>
                        </div>
                        <svg className="h-3.5 w-3.5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Community Ratings (on-chain) ──────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-gray-900">
              Community Ratings{" "}
              <span className="text-xs text-gray-400 font-normal">— on-chain, verified on Solana</span>
            </h2>
            {averages && (
              <span className="text-xs text-gray-400">{averages.totalRatings} rating{averages.totalRatings !== 1 ? "s" : ""}</span>
            )}
          </div>

          {averages ? (
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {[
                { label: "Development", value: averages.development },
                { label: "Anti-Corruption", value: averages.antiCorruption },
                { label: "Popularity", value: averages.popularity },
                { label: "Reform Effort", value: averages.reformEffort },
                { label: "Governance", value: averages.governance },
              ].map((item) => (
                <div key={item.label} className="space-y-2 text-center">
                  <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{item.label}</div>
                  <div className="text-2xl font-black text-gray-900">
                    {item.value.toFixed(1)}
                    <span className="text-xs text-gray-400 font-normal">/5</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#dc2626] rounded-full"
                      style={{ width: `${(item.value / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No on-chain ratings yet — be the first to rate this party!</p>
          )}

          {/* Rating form */}
          <div className="border-t border-gray-100 pt-5">
            {status === "connected" ? (
              userHasRated ? (
                <p className="text-sm text-green-600 font-semibold">
                  ✓ You have already rated this party. Updates are allowed within 24h of your submission.
                </p>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-gray-900">Submit Your Rating</h3>
                  <PartyRatingForm
                    onSubmit={submitRating}
                    onSubmitAnonymous={submitAnonymous}
                    zkSupported={zkSupported}
                  />
                </div>
              )
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-sm text-gray-500">Connect your wallet to rate this party</p>
                <WalletButton />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-400 mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-[#dc2626] font-black text-base">Rate My Politician</Link>
            <p className="text-xs text-gray-400 mt-0.5">© 2024 Rate My Politician. Transparent Governance &amp; Data Sovereignty.</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
            <Link href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-gray-600 transition-colors font-semibold text-gray-600 underline">Data Methodology</Link>
            <Link href="#" className="hover:text-gray-600 transition-colors">API Access</Link>
            <Link href="#" className="hover:text-gray-600 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
