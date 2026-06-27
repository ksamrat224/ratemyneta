import type { Grade, CompositeScore } from '@/types';

export function getGrade(score: number): Grade {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

export function calcObjectiveScore(
  attendancePercent: number,
  billsProposed: number,
  billsPassed: number,
): number {
  const passRate = billsProposed > 0 ? (billsPassed / billsProposed) * 100 : 0;
  const billScore = Math.min(billsProposed * 5, 50) + Math.min(passRate * 0.5, 50);
  return attendancePercent * 0.4 + billScore * 0.6;
}

export function calcStarScore(avgStars: number): number {
  return (avgStars - 1) * 25;
}

export function calcCommunityScore(janamatScore: number, avgStars: number): number {
  return janamatScore * 0.5 + calcStarScore(avgStars) * 0.5;
}

export function calcCompositeScore(
  attendancePercent: number,
  billsProposed: number,
  billsPassed: number,
  janamatScore: number,
  avgStars: number,
): CompositeScore {
  const objective = calcObjectiveScore(attendancePercent, billsProposed, billsPassed);
  const community = calcCommunityScore(janamatScore, avgStars);
  const composite = objective * 0.6 + community * 0.4;
  return { composite, objective, community, grade: getGrade(composite) };
}
