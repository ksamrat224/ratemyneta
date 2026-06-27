import type { Grade } from "@/types";

const GRADE_COLORS: Record<Grade, string> = {
  A: "#22c55e",
  B: "#84cc16",
  C: "#eab308",
  D: "#f97316",
  F: "#ef4444",
};

interface ScoreRingProps {
  score: number;
  grade: Grade;
  size?: number;
}

export function ScoreRing({ score, grade, size = 80 }: ScoreRingProps) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score));
  const dash = (progress / 100) * circumference;
  const color = GRADE_COLORS[grade];

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={8}
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-xs font-bold" style={{ color }}>
          {grade}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {Math.round(score)}
        </span>
      </div>
    </div>
  );
}
