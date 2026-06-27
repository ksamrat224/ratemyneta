import Link from "next/link";
import { ScoreRing } from "./ScoreRing";
import { PartyBadge } from "./PartyBadge";
import { TrendArrow } from "./TrendArrow";
import { calcCompositeScore } from "@/app/data/scoring";
import { getJanamatScore } from "@/app/data/politicians";
import type { Politician } from "@/types";

interface PoliticianCardProps {
  politician: Politician;
  rank: number;
  avgStars: number;
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

  return (
    <Link
      href={`/politician/${politician.id}`}
      className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
    >
      <span className="w-7 text-center text-sm font-semibold text-gray-400">
        #{rank}
      </span>

      <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm shrink-0">
        {politician.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 dark:text-white truncate">
            {politician.name}
          </span>
          <PartyBadge partyId={politician.partyId} />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {politician.role} · {politician.constituency}
        </p>
      </div>

      <div className="hidden sm:flex flex-col items-center gap-0.5 text-xs text-gray-500 dark:text-gray-400 w-20">
        <span className="font-medium text-gray-800 dark:text-gray-200">
          {pd.attendancePercent}%
        </span>
        <span>Attendance</span>
      </div>

      <div className="hidden md:flex flex-col items-center gap-0.5 text-xs text-gray-500 dark:text-gray-400 w-20">
        <span className="font-medium text-gray-800 dark:text-gray-200">
          {pd.billsPassed}/{pd.billsProposed}
        </span>
        <span>Bills</span>
      </div>

      <div className="hidden md:flex flex-col items-center gap-0.5 text-xs text-gray-500 dark:text-gray-400 w-24">
        <span className="font-medium text-gray-800 dark:text-gray-200">
          {Math.round(janamat)}%
        </span>
        <span>Approval</span>
        <TrendArrow score={janamat} />
      </div>

      <ScoreRing score={composite} grade={grade} size={64} />
    </Link>
  );
}
