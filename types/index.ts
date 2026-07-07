export interface ParliamentData {
  attendancePercent: number;
  billsProposed: number;
  billsPassed: number;
  termStart: string;
  termEnd: string | null;
}

export interface Politician {
  id: string;
  name: string;
  nameNepali: string;
  party: string;
  partyId: string;
  role: string;
  constituency: string;
  electedYear: number;
  parliamentData: ParliamentData;
  relatedPollIds: number[];
  tags?: string[];
  imageUrl?: string;
}

export interface Party {
  id: string;
  name: string;
  nameNepali: string;
  shortName: string;
  color: string;
  seats: number;
  founded: number;
}

export interface JanamatPollOption {
  id: number;
  text: string;
  votes: number;
}

export interface JanamatPoll {
  id: number;
  title: string;
  description?: string;
  options: JanamatPollOption[];
  totalVotes: number;
  createdAt: string;
  updatedAt: string;
}

export interface OnChainPoliticianAccount {
  politicianId: string;
  authority: string;
  totalRatings: bigint;
  integritySum: bigint;
  workEthicSum: bigint;
  promisesKeptSum: bigint;
  overallSum: bigint;
  bump: number;
  createdAt: bigint;
  lastUpdated: bigint;
}

export interface OnChainRatingAccount {
  politicianId: string;
  voter: string;
  integrity: number;
  workEthic: number;
  promisesKept: number;
  overall: number;
  zkVerified: boolean;
  timestamp: bigint;
  bump: number;
}

export interface RatingFormValues {
  integrity: number;
  workEthic: number;
  promisesKept: number;
  overall: number;
}

export interface PoliticianAverages {
  integrity: number;
  workEthic: number;
  promisesKept: number;
  overall: number;
  totalRatings: number;
}

export interface PartyRatingFormValues {
  development: number;
  antiCorruption: number;
  popularity: number;
  reformEffort: number;
  governance: number;
}

export interface PartyAverages {
  development: number;
  antiCorruption: number;
  popularity: number;
  reformEffort: number;
  governance: number;
  totalRatings: number;
}

export type SortKey = 'score' | 'attendance' | 'bills' | 'approval';

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface CompositeScore {
  composite: number;
  objective: number;
  community: number;
  grade: Grade;
}
