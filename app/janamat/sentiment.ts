import type { JanamatPoll } from '@/types';

const POSITIVE_KEYWORDS = [
  'सकारात्मक', 'सही', 'राम्रो', 'सफल', 'उत्कृष्ट', 'समर्थन',
  'Strongly in favour', 'in favour', 'support', 'good', 'great',
  'excellent', 'agree', 'yes', 'positive', 'right', 'correct',
  'effective', 'honest', 'capable',
];

const NEGATIVE_KEYWORDS = [
  'गलत', 'स्टन्ट', 'भ्रष्ट', 'विरोध', 'नकारात्मक', 'खराब',
  'wrong', 'corrupt', 'stunt', 'against', 'no', 'bad', 'terrible',
  'ineffective', 'dishonest', 'disagree', 'oppose', 'negative',
  'failure', 'incompetent',
];

export function classifyOptionSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lower = text.toLowerCase();
  const isPositive = POSITIVE_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
  const isNegative = NEGATIVE_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
  if (isPositive && !isNegative) return 'positive';
  if (isNegative && !isPositive) return 'negative';
  return 'neutral';
}

export function computePollApproval(poll: JanamatPoll): number {
  if (!poll.totalVotes || poll.totalVotes === 0) return 50;

  let positiveVotes = 0;
  for (const option of poll.options) {
    if (classifyOptionSentiment(option.text) === 'positive') {
      positiveVotes += option.votes;
    }
  }

  return (positiveVotes / poll.totalVotes) * 100;
}

export function computeJanamatScore(polls: JanamatPoll[]): number {
  if (polls.length === 0) return 50;

  const now = Date.now();
  let weightedSum = 0;
  let totalWeight = 0;

  for (const poll of polls) {
    const daysOld = (now - new Date(poll.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const weight = Math.log(poll.totalVotes + 1) * Math.exp(-daysOld / 30);
    const approval = computePollApproval(poll);
    weightedSum += approval * weight;
    totalWeight += weight;
  }

  return totalWeight === 0 ? 50 : weightedSum / totalWeight;
}
