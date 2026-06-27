interface TrendArrowProps {
  score: number;
  baseline?: number;
}

export function TrendArrow({ score, baseline = 50 }: TrendArrowProps) {
  const diff = score - baseline;
  if (diff > 3) {
    return <span className="text-green-500 font-bold text-lg">↑</span>;
  }
  if (diff < -3) {
    return <span className="text-red-500 font-bold text-lg">↓</span>;
  }
  return <span className="text-gray-400 font-bold text-lg">→</span>;
}
