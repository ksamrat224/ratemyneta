import Link from "next/link";
import Image from "next/image";
import { calcCompositeScore } from "@/app/data/scoring";
import { getJanamatScore } from "@/app/data/politicians";
import type { Politician } from "@/types";

interface PoliticianCardProps {
  politician: Politician;
  rank: number;
  avgStars: number;
}

const GRADE_COLORS: Record<string, string> = {
  A: "bg-green-500",
  B: "bg-blue-500",
  C: "bg-yellow-500",
  D: "bg-orange-500",
  F: "bg-red-600",
};

const AVATAR_GRADIENTS = [
  "from-red-400 to-rose-600",
  "from-blue-400 to-indigo-600",
  "from-emerald-400 to-teal-600",
  "from-violet-400 to-purple-600",
  "from-amber-400 to-orange-600",
  "from-cyan-400 to-sky-600",
  "from-pink-400 to-fuchsia-600",
];

// Fake-but-consistent rating counts derived from name
function fakeRatingCount(name: string): string {
  const n = (name.charCodeAt(0) * 137 + name.length * 53) % 120 + 10;
  return n >= 100 ? `${(n / 10).toFixed(1)}k` : `${n}`;
}

export function PoliticianCard({ politician, rank, avgStars }: PoliticianCardProps) {
  const janamat = getJanamatScore(politician.id);
  const { parliamentData: pd } = politician;
  const { composite, grade } = calcCompositeScore(
    pd.attendancePercent,
    pd.billsProposed,
    pd.billsPassed,
    janamat,
    avgStars
  );

  const initials = politician.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const gradientIdx = politician.name.charCodeAt(0) % AVATAR_GRADIENTS.length;
  const gradient = AVATAR_GRADIENTS[gradientIdx];
  const gradeColor = GRADE_COLORS[grade] ?? "bg-gray-400";
  const ratingCount = fakeRatingCount(politician.name);

  // Grade display: A+ for >90, A for >80, etc.
  const gradeLabel = composite >= 90 ? `${grade}+` : composite >= 75 ? grade : composite >= 60 ? `${grade}-` : grade;

  return (
    <Link
      href={`/politician/${politician.id}`}
      className="flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* Photo / Avatar area */}
      <div className={`relative h-48 w-full bg-linear-to-br ${gradient} flex items-center justify-center shrink-0 overflow-hidden`}>
        {politician.imageUrl ? (
          <Image
            src={politician.imageUrl}
            alt={politician.name}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-white font-black text-2xl shadow-lg select-none">
            {initials}
          </div>
        )}

        {/* ACTIVE badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          ACTIVE
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Bilingual name */}
        <div>
          <h3 className="text-base font-bold text-gray-900 leading-snug">
            {politician.nameNepali}{" "}
            <span className="text-gray-700">({politician.name})</span>
          </h3>
        </div>

        {/* Location + Role */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {politician.constituency}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-medium">
              {politician.role}
            </span>
          </div>
        </div>

        {/* Attendance bar */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">Attendance</span>
            <span className="text-xs font-bold text-[#dc2626]">{pd.attendancePercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#dc2626] rounded-full"
              style={{ width: `${pd.attendancePercent}%` }}
            />
          </div>
        </div>

        {/* Tags */}
        {politician.tags && politician.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {politician.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer: ratings + grade */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium">{ratingCount} ratings</span>
          </div>
          <div className={`h-9 w-9 rounded-full ${gradeColor} flex items-center justify-center text-white text-xs font-black shadow-sm`}>
            {gradeLabel}
          </div>
        </div>
      </div>
    </Link>
  );
}
