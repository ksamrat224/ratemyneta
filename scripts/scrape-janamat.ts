import * as fs from "fs";
import * as path from "path";
import axios from "axios";

const BASE_URL = "https://janamat-backend-new-production.up.railway.app/api/v1";

// Keywords must be specific enough to a single politician. Bare Nepali
// surnames/first-names (e.g. "Rabi", "Oli", "Dahal", "Wagle") false-match
// unrelated candidates sharing that common name — e.g. "Rabi" incorrectly
// matched "Rabi Singh Kushwaha", a Sarlahi-4 candidate with no relation to
// Rabi Lamichhane. Always require the full name (plus known misspellings).
const POLITICIAN_KEYWORDS: Record<string, string[]> = {
  "balen-shah": ["बालेन", "Balen", "बालेन शाह"],
  "rabi-lamichhane": ["रबि लामिछाने", "Rabi Lamichhane", "Rabi Lamichane"],
  "swarnim-wagle": ["स्वर्णिम वाग्ले", "Swarnim Wagle"],
  "bhishmaraj-aangdambe": ["भीष्मराज", "Bhishmaraj", "आङदम्बे"],
  "sunil-lamsal": ["सुनिल लम्साल", "Sunil Lamsal"],
  "rekha-sharma": ["रेखा शर्मा", "Rekha Sharma"],
  "sudan-gurung": ["सुदन गुरुङ", "Sudan Gurung"],
  "pushpa-kamal-dahal": ["पुष्पकमल दाहाल", "Pushpa Kamal Dahal", "Prachanda"],
  "kp-sharma-oli": ["केपी शर्मा ओली", "KP Oli", "KP Sharma Oli"],
  "sher-bahadur-deuba": ["शेरबहादुर देउवा", "Sher Bahadur Deuba", "Deuba"],
  "gagan-thapa": ["गगन थापा", "Gagan Thapa"],
  "rajendra-lingden": ["राजेन्द्र लिङदेन", "Rajendra Lingden", "Lingden"],
  "bishnu-paudel": ["विष्णु पौडेल", "Bishnu Paudel"],
  "madhav-kumar-nepal": ["माधवकुमार नेपाल", "Madhav Kumar Nepal", "Madhav Nepal"],
  "prakash-sharan-mahat": ["प्रकाशशरण महत", "Prakash Sharan Mahat", "Prakash Mahat"],
};

interface Poll {
  id: number;
  title: string;
  options: Array<{ id: number; index: number; text: string }>;
  totalVotes: number;
  optionVoteCounts: Record<string, number>;
  startTime: string;
}

function votesFor(poll: Poll, option: Poll["options"][number]): number {
  return poll.optionVoteCounts[option.index] ?? 0;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchAllPolls(): Promise<Poll[]> {
  const all: Poll[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    try {
      const { data } = await axios.get(`${BASE_URL}/polls`, {
        params: { limit, offset },
        timeout: 10000,
      });
      const batch: Poll[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.polls)
        ? data.polls
        : [];

      if (batch.length === 0) break;
      all.push(...batch);
      console.log(`Fetched ${all.length} polls so far...`);
      if (batch.length < limit) break;
      offset += limit;
      await sleep(300);
    } catch (err) {
      console.error("Error fetching polls:", err);
      break;
    }
  }

  return all;
}

function computeApproval(poll: Poll): number {
  if (!poll.totalVotes) return 50;
  const POSITIVE = ["positive", "favour", "support", "yes", "good", "right", "सकारात्मक", "सही", "राम्रो"];
  const NEGATIVE = ["negative", "against", "wrong", "no", "bad", "corrupt", "गलत", "भ्रष्ट", "स्टन्ट"];

  let positiveVotes = 0;
  for (const opt of poll.options) {
    const lower = opt.text.toLowerCase();
    const votes = votesFor(poll, opt);
    if (POSITIVE.some((kw) => lower.includes(kw))) {
      positiveVotes += votes;
    } else if (!NEGATIVE.some((kw) => lower.includes(kw))) {
      positiveVotes += votes * 0.5;
    }
  }
  return (positiveVotes / poll.totalVotes) * 100;
}

function matchPolitician(poll: Poll): string | null {
  const text = `${poll.title} ${poll.options.map((o) => o.text).join(" ")}`;
  for (const [politicianId, keywords] of Object.entries(POLITICIAN_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return politicianId;
    }
  }
  return null;
}

async function main() {
  console.log("Fetching Janamat polls...");
  const polls = await fetchAllPolls();
  console.log(`Total polls fetched: ${polls.length}`);

  const scores: Record<string, { weightedSum: number; totalWeight: number }> = {};
  const relatedPolls: Record<string, number[]> = {};
  const now = Date.now();

  for (const poll of polls) {
    const politicianId = matchPolitician(poll);
    if (!politicianId) continue;

    const daysOld = (now - new Date(poll.startTime).getTime()) / (1000 * 60 * 60 * 24);
    const weight = Math.log(poll.totalVotes + 1) * Math.exp(-daysOld / 30);
    const approval = computeApproval(poll);

    if (!scores[politicianId]) {
      scores[politicianId] = { weightedSum: 0, totalWeight: 0 };
    }
    scores[politicianId].weightedSum += approval * weight;
    scores[politicianId].totalWeight += weight;

    if (!relatedPolls[politicianId]) relatedPolls[politicianId] = [];
    relatedPolls[politicianId].push(poll.id);
  }

  const result: Record<string, number> = {};
  for (const [id, { weightedSum, totalWeight }] of Object.entries(scores)) {
    result[id] = totalWeight === 0 ? 50 : weightedSum / totalWeight;
  }

  const outPath = path.join(__dirname, "../app/data/janamat-scores.json");
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`\nWrote scores for ${Object.keys(result).length} politicians to ${outPath}`);
  console.log(JSON.stringify(result, null, 2));

  const relatedPollsPath = path.join(__dirname, "../app/data/related-polls.json");
  fs.writeFileSync(relatedPollsPath, JSON.stringify(relatedPolls, null, 2));
  console.log(`\nWrote related poll IDs for ${Object.keys(relatedPolls).length} politicians to ${relatedPollsPath}`);
  console.log(JSON.stringify(relatedPolls, null, 2));
}

main().catch(console.error);
