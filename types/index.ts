export interface ParliamentData {
  attendancePercent: number;
  billsProposed: number;
  billsPassed: number;
  termStart: string;
  termEnd: string | null;
  questionsRaised?: number;
  committeesServed?: number;
}

export interface CorruptionRecord {
  casesRegistered: number;
  casesConvicted: number;
  casesPending: number;
  ciaaInvestigations: number;
  assetGrowthPercent: number;
}

export interface PromisesTracked {
  total: number;
  fulfilled: number;
  pending: number;
  broken: number;
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
  bio?: string;
  socialLinks?: {
    twitter?: string;
    facebook?: string;
  };
  corruptionRecord?: CorruptionRecord;
  promisesTracked?: PromisesTracked;
}

export interface PartyScandal {
  year: number;
  title: string;
  description: string;
  severity: 'minor' | 'major' | 'critical';
  resolved: boolean;
  sourceUrl?: string;
  pointDeduction: number;
}

export interface PartyReform {
  year: number;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'transformative';
  impactPoints: number;
  sourceUrl?: string;
}

export interface PartyObjectiveData {
  memberAttendanceAvg: number;
  billsPassedInLastTenure: number;
  gdpGrowthDuringTenure?: number;
  developmentProjectsCompleted: number;
  corruptionCasesAgainstMembers: number;
  electionPromises: PromisesTracked;
  majorScandals: PartyScandal[];
  majorReforms: PartyReform[];
}

export interface Party {
  id: string;
  name: string;
  nameNepali: string;
  shortName: string;
  color: string;
  seats: number;
  founded: number;
  ideology?: string[];
  president?: string;
  objectiveData?: PartyObjectiveData;
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
