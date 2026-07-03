import type { Grade } from "@/types";

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

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={6}
          className="text-gray-100 dark:text-gray-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#dc2626"
          strokeWidth={6}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-lg font-black text-gray-900 dark:text-white">
          {grade}
        </span>
        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-0.5">
          {Math.round(score)}
        </span>
      </div>
    </div>
  );
}
