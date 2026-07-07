import axios from 'axios';
import type { JanamatPoll } from '@/types';

const BASE_URL = 'https://janamat-backend-new-production.up.railway.app/api/v1';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Raw shape returned by the Janamat API — options carry an `index`, and
 * per-option vote counts live in a separate `optionVoteCounts` map keyed by
 * that index rather than on the option itself. */
interface RawJanamatPoll {
  id: number;
  title: string;
  description?: string;
  options: Array<{ id: number; index: number; text: string }>;
  totalVotes: number;
  optionVoteCounts: Record<string, number>;
  startTime: string;
}

function normalizePoll(raw: RawJanamatPoll): JanamatPoll {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    totalVotes: raw.totalVotes,
    createdAt: raw.startTime,
    updatedAt: raw.startTime,
    options: raw.options.map((opt) => ({
      id: opt.id,
      text: opt.text,
      votes: raw.optionVoteCounts[opt.index] ?? 0,
    })),
  };
}

export async function fetchPolls(limit = 50, offset = 0): Promise<JanamatPoll[]> {
  const { data } = await axios.get(`${BASE_URL}/polls`, { params: { limit, offset } });
  const batch: RawJanamatPoll[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.polls)
    ? data.polls
    : [];
  return batch.map(normalizePoll);
}

export async function fetchPoll(id: number): Promise<JanamatPoll> {
  const { data } = await axios.get(`${BASE_URL}/polls/${id}`);
  return normalizePoll(data?.poll ?? data?.data ?? data);
}

export async function fetchAllPolls(): Promise<JanamatPoll[]> {
  const all: JanamatPoll[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const batch = await fetchPolls(limit, offset);
    if (batch.length === 0) break;
    all.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
    await sleep(300);
  }

  return all;
}
