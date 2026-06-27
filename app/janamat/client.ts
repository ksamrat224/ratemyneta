import axios from 'axios';
import type { JanamatPoll } from '@/types';

const BASE_URL = 'https://janamat-backend-new-production.up.railway.app/api/v1';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchPolls(limit = 50, offset = 0): Promise<JanamatPoll[]> {
  const { data } = await axios.get(`${BASE_URL}/polls`, { params: { limit, offset } });
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.polls)) return data.polls;
  return [];
}

export async function fetchPoll(id: number): Promise<JanamatPoll> {
  const { data } = await axios.get(`${BASE_URL}/polls/${id}`);
  return data?.data ?? data;
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
