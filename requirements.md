# Rate My Politician — Requirements (v2)

> **Civic accountability dApp for Nepal.**
> Citizens rate politicians AND parties on performance, integrity, and reform impact.
> Anonymous voting enforced by ZK nullifiers. Immutable on Solana.

---

## Tech Stack

| Concern | Library | Notes |
|---|---|---|
| Frontend | Next.js 16 (App Router) | Already in template |
| Styling | Tailwind CSS v4 | CSS-first, no tailwind.config.js |
| Solana client | `@solana/kit` | NOT `@solana/web3.js` |
| Wallet | `@wallet-standard` | Wired in template |
| Transactions | `useSendTransaction` hook | Lives in `app/lib/hooks/` |
| On-chain program | Anchor 0.30 | `anchor/programs/rate-my-politician/` |
| IDL → TypeScript | Codama (`npm run codama:js`) | Generates `app/generated/` — never hand-write |
| Toast notifications | `sonner` | Already in template |
| Data fetching | `swr` | Already in template |
| ZK hashing | `@zk-kit/poseidon-cipher` | Poseidon hash for nullifiers |
| ZK compression | Light Protocol (`@lightprotocol/stateless.js`) | Phase 2 — compressed nullifier storage |

**Additional packages:**
```bash
npm install axios clsx @zk-kit/poseidon-cipher
```

---

## Data Architecture: What Goes Where

### On Blockchain (Solana — permanent, trustless)

| Account | Seeds | Contents |
|---|---|---|
| `PoliticianAccount` | `["politician", politician_id]` | Aggregate rating sums for a politician |
| `RatingAccount` | `["rating", politician_id, voter_pubkey]` | One citizen rating per politician |
| `AnonRatingAccount` | `["anon_rating", nullifier]` | Anonymous rating via ZK nullifier |
| `NullifierAccount` | `["nullifier", nullifier]` | Prevents double-voting (ZK path) |
| `PartyAccount` | `["party", party_id]` | Aggregate party rating sums |
| `PartyRatingAccount` | `["party_rating", party_id, voter_pubkey]` | One citizen rating per party |

### Off Blockchain (JSON files — curated, updatable)

| File | Contents | Data Source |
|---|---|---|
| `app/data/politicians.ts` | Bio, parliamentary stats, corruption record, promises | Parliament records + Jawafdehi + manual research |
| `app/data/parties.ts` | Party metadata, scandals, reforms, objective metrics | Election Commission + CIAA + Wikipedia |
| `app/data/janamat-scores.json` | Janamat poll approval per politician | `npm run scrape` |
| `app/data/party-objective-scores.json` | Pre-computed objective party scores | `npm run score-parties` |

---

## Data Schemas (full JSON shapes)

### Politician (extended `types/index.ts`)

```typescript
interface Politician {
  id: string                    // slug: "balen-shah"
  name: string                  // "Balen Shah"
  nameNepali: string            // "बालेन शाह"
  imageUrl?: string             // photo URL (optional, use avatar fallback)
  party: string                 // full party name
  partyId: string               // matches parties.ts key
  role: string                  // "Mayor" | "Member of Parliament" | "Prime Minister"
  constituency: string          // "Kathmandu Metropolitan"
  electedYear: number
  bio?: string                  // short English bio
  tags?: string[]               // ["Progressive", "Urban Dev"]
  socialLinks?: {
    twitter?: string
    facebook?: string
  }
  parliamentData: {
    attendancePercent: number   // 0–100
    billsProposed: number
    billsPassed: number
    questionsRaised?: number    // parliamentary questions raised
    committeesServed?: number   // number of committees
    termStart: string           // ISO date
    termEnd: string | null
  }
  corruptionRecord: {
    casesRegistered: number     // total CIAA/court cases ever filed
    casesConvicted: number      // convictions
    casesPending: number        // active investigations
    ciaaInvestigations: number  // CIAA-specific
    assetGrowthPercent: number  // % change in declared assets since election (0 = baseline)
  }
  promisesTracked: {
    total: number
    fulfilled: number
    pending: number
    broken: number
  }
  relatedPollIds: number[]      // Janamat poll IDs
}
```

### Party (extended `types/index.ts`)

```typescript
interface Party {
  id: string                    // "nc" | "cpn_uml" | "cpn_mc" | "rsn" | "rpp" | "janmat"
  name: string                  // "Nepali Congress"
  nameNepali: string            // "नेपाली कांग्रेस"
  shortName: string             // "NC"
  color: string                 // brand hex
  seats: number                 // current parliamentary seats
  founded: number               // year
  ideology: string[]            // ["Liberal Democracy", "Social Democracy"]
  president?: string            // current party president name
  objectiveData: {
    memberAttendanceAvg: number           // avg attendance of tracked MPs (0–100)
    billsPassedInLastTenure: number       // bills passed when party was in government
    gdpGrowthDuringTenure?: number        // % GDP growth during last tenure in power
    developmentProjectsCompleted: number  // major infra/social projects completed
    corruptionCasesAgainstMembers: number // CIAA/court cases against party MPs
    electionPromises: {
      total: number
      fulfilled: number
      pending: number
      broken: number
    }
    majorScandals: Array<{
      year: number
      title: string                // short title
      description: string          // 1–2 sentence description
      severity: 'minor' | 'major' | 'critical'
      resolved: boolean
      sourceUrl?: string           // link to news/CIAA filing
      pointDeduction: number       // how many points this deducts from partyScore
    }>
    majorReforms: Array<{
      year: number
      title: string
      description: string
      impact: 'low' | 'medium' | 'high' | 'transformative'
      impactPoints: number         // points added to reform score (see algorithm)
      sourceUrl?: string
    }>
  }
}
```

### JanamatPoll (unchanged)

```typescript
interface JanamatPoll {
  id: number
  title: string
  description?: string
  options: JanamatPollOption[]
  totalVotes: number
  createdAt: string
}

interface JanamatPollOption {
  id: number
  text: string
  votes: number
}
```

---

## Dynamic UI Data Requirements

Every number/string currently hardcoded in the UI, what data replaces it, the format, and where it lives. Rule of thumb: **on-chain = anything a citizen submits; JSON in `app/data/` = curated facts that change occasionally; computed at render = anything derivable from the other two.**

### 1. Party profile page (`/party/[id]`) — highest priority

The `PARTY_DETAILS` map hardcoded inside `app/(routes)/party/[id]/page.tsx` must move into `parties.ts` as a `profile` field on each party:

```typescript
interface PartyProfile {
  bio: string                       // 2–3 sentence English intro
  president: string                 // current party president
  approvalRating: number            // 0–100, from latest national survey / Janamat
  billsSponsored: number            // current parliament session
  billsPassed: number
  attendanceByMonth: Array<{        // last 6 months, replaces hardcoded bar chart
    month: string                   // "Jan" … "Jun"
    percent: number                 // 0–100
  }>
  achievements: Array<{
    year: number
    title: string
    description: string
    sourceUrl?: string
  }>
  controversies: Array<{
    year: number
    title: string
    description: string
    status: 'Under Investigation' | 'Resolved' | 'Ongoing' | 'Court Case'
    sourceUrl?: string
  }>
}
// Party interface gains:  profile: PartyProfile
```

**Sources:** attendance → Digital Pratipakshya monthly reports; bills → parliament records; controversies → Jawafdehi/CIAA; approval → Janamat polls.

### 2. Homepage (`app/page.tsx`)

| Hardcoded today | Replace with | Format |
|---|---|---|
| "2.4M+ verified votes" | Sum of `total_ratings` across all on-chain `PoliticianAccount` + `PartyAccount` | Computed via RPC (`getProgramAccounts`) or a cached `app/data/platform-stats.json` refreshed by a script |
| Live ticker items | Curated news feed | `app/data/ticker.json`: `Array<{ text: string, textNepali?: string, url?: string, date: string }>` |
| Party activity badges (HIGH ACTIVITY / MONITORING / …) | Derived from data | Computed: attendance ≥ 80 → HIGH ACTIVITY; open critical scandal → MONITORING; seats growth → RISING; else NEUTRAL |
| Performance sentiment split | Janamat aggregate | Computed from `janamat-scores.json` (positive/negative poll option ratios) |

### 3. Party list page (`/party`)

Status pills (Active / Registered / National) are hardcoded identically on every card. Add to `Party`:

```typescript
status: {
  active: boolean            // fielding candidates in current cycle
  registered: boolean        // ECN registration current
  scope: 'national' | 'regional'   // ECN classification
}
```

**Source:** Election Commission Nepal party register.

### 4. Politician profile page (`/politician/[id]`)

| Hardcoded/synthesized today | Replace with |
|---|---|
| Approval trend chart (points synthesized from a single number) | `approvalByMonth: Array<{ month: string, percent: number }>` on `Politician` — from monthly Janamat snapshots (extend `scrape-janamat.ts` to append a dated snapshot instead of overwriting) |
| "Recent Legislative Actions" (templated from attendance/bills) | `recentActions: Array<{ date: string, title: string, description: string, sourceUrl?: string }>` on `Politician` — from parliament records |
| Corruption/promises cards (Phase C) | `corruptionRecord` + `promisesTracked` fields already specified above |

### 5. Already dynamic (no action)

- All rating averages and totals — on-chain, polled via SWR every 30s
- Janamat approval scores — `janamat-scores.json` via `npm run scrape`
- Composite scores/grades — computed at render from the above

---

## Data Sources

| Data | Source | How to Access |
|---|---|---|
| Parliament attendance + bills | [Digital Pratikpashya](https://digitalpratipakshya.com/gov-monitoring) | Manual scrape / CSV export |
| CIAA corruption cases | [Jawafdehi.org](https://jawafdehi.org) | Browse by politician name; AI-assisted archive |
| CIAA annual reports | [ciaa.gov.np](https://ciaa.gov.np) | PDF reports — parse manually |
| Open datasets Nepal | [opendatanepal.com](https://opendatanepal.com) | CSV/JSON downloads |
| Election results + party seats | [Election Commission Nepal](https://election.gov.np) | Official data |
| Janamat polls | `https://janamat-backend-new-production.up.railway.app/api/v1/polls` | `npm run scrape` |
| GDP growth data | [World Bank Nepal](https://data.worldbank.org/country/nepal) | Public API |
| Corruption perception | [Transparency International](https://www.transparency.org/en/countries/nepal) | Nepal ranked 109th, score 34/100 (2025) |
| Scandal archive | [OCCRP Nepal](https://www.occrp.org) + [Kathmandu Post](https://kathmandupost.com) | Manual research |

---

## Politician Scoring Algorithm (`app/data/scoring.ts`)

```
compositeScore (0–100) =
  (objectiveScore × 0.55) + (communityScore × 0.30) + (integrityBonus × 0.15)

objectiveScore =
  (attendancePercent × 0.40) + (billScore × 0.60)
  billScore = min(billsProposed × 5, 50) + min(passRate × 0.5, 50)

communityScore =
  (janamatScore × 0.50) + (starScore × 0.50)
  starScore = ((avg of 4 star categories on-chain) − 1) × 25   → 0–100

integrityBonus = corruptionIntegrityScore(corruptionRecord, promisesTracked)
  = max(0, 100
      − corruptionRecord.casesConvicted × 25
      − corruptionRecord.ciaaInvestigations × 8
      − corruptionRecord.casesPending × 5
      − Math.min(corruptionRecord.assetGrowthPercent / 2, 20)
      + (promisesTracked.fulfilled / Math.max(promisesTracked.total, 1)) × 20
    )

Grade: A ≥ 80 | B ≥ 65 | C ≥ 50 | D ≥ 35 | F < 35
```

---

## Party Scoring Algorithm (`app/data/party-scoring.ts`)

The party score is a four-pillar composite. It combines on-chain citizen ratings with curated off-chain objective data.

```
partyCompositeScore (0–100) =
  (communityRatingScore × 0.35) +
  (objectiveGovernanceScore × 0.30) +
  (reformImpactScore × 0.20) +
  (corruptionIndex × 0.15)

─────────────────────────────────────────────────────
PILLAR 1: Community Rating Score (on-chain)
─────────────────────────────────────────────────────
Five on-chain categories (each rated 1–5 by citizens):
  1. development_rating    — infrastructure, education, healthcare impact
  2. anti_corruption       — how well the party fights corruption internally
  3. popularity            — overall public satisfaction
  4. reform_effort         — policy innovation, constitutional changes
  5. governance            — democratic process, transparency, rule of law

communityRatingScore =
  avg(development_sum, anti_corruption_sum, popularity_sum,
      reform_effort_sum, governance_sum) / total_party_ratings
  → normalize 1–5 to 0–100: (avgRating − 1) × 25

─────────────────────────────────────────────────────
PILLAR 2: Objective Governance Score (off-chain JSON)
─────────────────────────────────────────────────────
objectiveGovernanceScore =
  (memberAttendanceAvg × 0.40) +
  (billsPassedRate × 0.60)

billsPassedRate =
  (billsPassedInLastTenure / max(billsProposed, 1)) × 100

─────────────────────────────────────────────────────
PILLAR 3: Reform Impact Score (off-chain JSON)
─────────────────────────────────────────────────────
Each reform has an impactPoints value:
  transformative reform:  20 points  (constitution, federal restructure)
  high-impact reform:     15 points  (major economic or social policy)
  medium-impact reform:   10 points  (sector-specific reform)
  low-impact reform:       5 points  (minor administrative change)

reformImpactScore = min(sum of all reform.impactPoints, 100)

─────────────────────────────────────────────────────
PILLAR 4: Corruption Index (off-chain JSON, inverted)
─────────────────────────────────────────────────────
corruptionIndex = max(0,
  100
  − criticalScandals × 20
  − majorScandals × 12
  − minorScandals × 5
  − casesAgainstMembers × 3
)
where criticalScandals, majorScandals, minorScandals are counts from objectiveData.majorScandals

─────────────────────────────────────────────────────
Party Grade Scale
─────────────────────────────────────────────────────
A+ ≥ 88 | A ≥ 80 | B+ ≥ 72 | B ≥ 65 | C+ ≥ 58 | C ≥ 50 | D ≥ 35 | F < 35
```

---

## Zero-Knowledge Proof Architecture

The goal: citizens can rate anonymously — the blockchain records THAT someone rated, but not WHO. One rating per person per target, enforced without linking to a wallet identity.

### Phase 1 — MVP: Poseidon Nullifier ✅ IMPLEMENTED

**Status:** Live end-to-end. Program instructions (`submit_rating_anonymous`, `submit_party_rating_anonymous`), `app/lib/zk/nullifier.ts` (Poseidon derivation), `app/lib/hooks/use-zk-rating.ts` (both hooks), wallet `signMessage` support, and the Public/Anonymous toggle in both rating forms are done.

**Known Phase 1 privacy caveat:** the anonymous transaction is still *paid* by a wallet, so an on-chain observer can see which wallet paid the fee — the rating data itself is only linked to the nullifier, not the pubkey, but full unlinkability requires a burner wallet or a relayer (or Phase 2). Double-vote prevention is fully enforced regardless.

**Concept:** Each citizen derives a secret from their wallet signature. They compute a Poseidon hash (ZK-friendly hash function) as a nullifier. The nullifier is stored on-chain; if it already exists, the rating is rejected.

```
nullifier = Poseidon(H(wallet_signature("rate-my-neta-v1")), target_id_hash)
```

- `wallet_signature("rate-my-neta-v1")` — deterministic signature over a fixed message
- `target_id_hash` — Poseidon hash of the politician_id or party_id string
- The nullifier reveals nothing about the voter or which specific target they rated beyond what's in the tx
- Stored in `NullifierAccount` PDA with seeds `["nullifier", nullifier_bytes]`

**Frontend flow:**
1. Citizen connects wallet
2. Wallet signs fixed message `"rate-my-neta-v1"` (off-chain, no SOL spent)
3. Frontend computes: `secret = hash(signature)`, `nullifier = Poseidon(secret, targetIdHash)`
4. Frontend checks: does `NullifierAccount` PDA for this nullifier already exist?
5. If not → citizen submits `submit_rating_anonymous(nullifier, ratings...)`
6. Program creates `NullifierAccount` and `AnonRatingAccount`
7. Future attempt with same wallet+target → nullifier already exists → rejected on-chain

**Library:** `@zk-kit/poseidon-cipher` for Poseidon hash in TypeScript frontend.

### Phase 2 — Full ZK: Light Protocol Compressed Nullifiers

After MVP, migrate nullifier storage to Light Protocol's ZK Compressed Accounts:
- Nullifiers stored in a Merkle tree (off-chain state, on-chain commitment)
- Cost of storing a nullifier drops ~200× (no rent)
- Full ZK circuit proves: (1) nullifier is correctly derived from a secret, (2) secret corresponds to a valid wallet, (3) nullifier not previously used
- Use `@lightprotocol/stateless.js` SDK + `PhotonApi` for Merkle proofs

**Key constraint:** Phase 1 and Phase 2 are additive. Phase 1 ratings remain valid. Phase 2 just adds a cheaper/more private path.

---

## Anchor Program — Full Spec (`anchor/programs/rate-my-politician/src/lib.rs`)

### Existing Instructions
- `initialize_politician(politician_id)` — creates PoliticianAccount PDA
- `submit_rating(politician_id, integrity, work_ethic, promises_kept, overall)` — linked to voter pubkey. **`zk_verified` is no longer a caller argument** — the program hardcodes `zk_verified = false` on this path so a public rating can never masquerade as ZK-verified. Only the anonymous nullifier path produces ZK-linked ratings.
- `update_rating(integrity, work_ethic, promises_kept, overall)` — within 24h window

### New Instructions

**`initialize_party(party_id: String)`**
- Called once per party by deployer/admin
- Creates `PartyAccount` PDA
- Seeds: `["party", party_id.as_bytes()]`

**`submit_party_rating(party_id, development, anti_corruption, popularity, reform_effort, governance)`**
- Called by a citizen (connected wallet)
- Creates `PartyRatingAccount` PDA — 1 rating per (party × voter)
- Seeds: `["party_rating", party_id.as_bytes(), voter.key().as_ref()]`
- Updates `PartyAccount` aggregate sums atomically
- All categories: 1–5

**`update_party_rating(development, anti_corruption, popularity, reform_effort, governance)`**
- Lets voter revise within 24h
- Subtracts old values, adds new values

**`submit_rating_anonymous(politician_id, nullifier: [u8; 32], integrity, work_ethic, promises_kept, overall)`**
- ZK path: rating linked to nullifier, not voter pubkey
- Creates `NullifierAccount` PDA — if it exists, tx fails (double-vote prevention)
- Seeds for NullifierAccount: `["nullifier", nullifier]`
- Creates `AnonRatingAccount` — stores ratings without voter identity
- Updates `PoliticianAccount` aggregate sums
- No update window (anonymous — no way to verify identity for update)

**`submit_party_rating_anonymous(party_id, nullifier: [u8; 32], development, anti_corruption, popularity, reform_effort, governance)`**
- Same pattern as above, but for parties
- Seeds for NullifierAccount: `["nullifier", nullifier]` (shared nullifier namespace prevents rating both anon paths with same nullifier)

### Account Structures

**`PartyAccount`**
```rust
party_id:              String   (max 32 chars)
authority:             Pubkey
total_ratings:         u64
development_sum:       u64
anti_corruption_sum:   u64
popularity_sum:        u64
reform_effort_sum:     u64
governance_sum:        u64
bump:                  u8
created_at:            i64
last_updated:          i64
```

**`PartyRatingAccount`**
```rust
party_id:              String
voter:                 Pubkey
development:           u8   (1–5)
anti_corruption:       u8   (1–5)
popularity:            u8   (1–5)
reform_effort:         u8   (1–5)
governance:            u8   (1–5)
timestamp:             i64
bump:                  u8
```

**`NullifierAccount`** (ZK path — both politician + party)
```rust
nullifier:             [u8; 32]   (Poseidon hash)
target_type:           u8         (0 = politician, 1 = party)
bump:                  u8
created_at:            i64
```

**`AnonRatingAccount`** (politician — ZK path)
```rust
politician_id:         String
nullifier:             [u8; 32]
integrity:             u8
work_ethic:            u8
promises_kept:         u8
overall:               u8
timestamp:             i64
bump:                  u8
```

### New Errors
- `InvalidPartyRating` — party category value outside 1–5
- `PartyIdTooLong` — party_id > 32 chars
- `NullifierAlreadyUsed` — ZK path double-vote attempt

---

## Scoring Files to Add/Modify

### `app/data/party-scoring.ts` (new)

```typescript
export function calcPartyObjectiveScore(party: Party): number
export function calcPartyCorruptionIndex(party: Party): number
export function calcPartyReformScore(party: Party): number
export function calcPartyCompositeScore(
  party: Party,
  communityRatingAvg: number  // from on-chain PartyAccount
): { composite: number; pillarBreakdown: PartyPillarBreakdown }
export function getPartyGrade(score: number): string  // "A+" | "A" | "B+" ...
```

### `app/data/scoring.ts` (add integrityBonus)

```typescript
export function calcCorruptionIntegrityScore(
  corruption: Politician['corruptionRecord'],
  promises: Politician['promisesTracked']
): number
```

---

## Components to Add

| Component | Description |
|---|---|
| `app/components/party/PartyRatingForm.tsx` | 5-category star form (development, anti-corruption, popularity, reform, governance) — wallet-gated |
| `app/components/party/PartyScorePillar.tsx` | Visual breakdown of the 4 pillars with bars |
| `app/components/party/ScandalTimeline.tsx` | Chronological scandal list with severity badges |
| `app/components/party/ReformTimeline.tsx` | Chronological reform list with impact badges |
| `app/components/politician/CorruptionCard.tsx` | Corruption record display for politician profile |
| `app/components/politician/PromiseMeter.tsx` | Fulfilled/pending/broken promise tracker |
| `app/components/zk/ZkBadge.tsx` | "ZK Verified" badge shown on anon ratings |

---

## Pages to Add/Update

### `/party/[id]` — Party Profile Page (new)

- Header: party logo/color, name bilingual, ideology pills, seats count, grade badge
- 4-pillar score breakdown (`<PartyScorePillar>`)
- Scandal timeline (`<ScandalTimeline>`)
- Reform timeline (`<ReformTimeline>`)
- Community rating card — on-chain averages for 5 categories
- `<PartyRatingForm>` (wallet-connected + not yet rated)
- Member MPs list (filtered from politicians.ts)

### `/politician/[id]` — Update Profile Page

- Add `<CorruptionCard>` — shows CIAA cases, conviction count, asset growth
- Add `<PromiseMeter>` — fulfilled/pending/broken
- Tag anonymous ratings with `<ZkBadge>` alongside wallet-linked ratings
- Integrity score shown separately from composite

---

## Hooks to Add

### `app/lib/hooks/use-party-ratings.ts`

Same pattern as `use-ratings.ts`:
- Read `PartyAccount` via RPC
- `submitPartyRating(partyId, ratings)` → builds + sends `submit_party_rating` tx
- `userHasRatedParty(partyId)` → checks for `PartyRatingAccount` PDA

### `app/lib/hooks/use-zk-rating.ts`

- `computeNullifier(walletSignature, targetId)` → Poseidon hash
- `userHasRatedAnon(nullifier)` → checks for `NullifierAccount` PDA
- `submitAnonRating(politicianId, ratings)`:
  1. Request wallet to sign `"rate-my-neta-v1"` (off-chain)
  2. Compute nullifier
  3. Check if already used
  4. Build + send `submit_rating_anonymous` tx via `useSendTransaction`

---

## Scripts to Add

### `scripts/score-parties.ts`

```bash
npm run score-parties
```

1. Read `app/data/parties.ts`
2. Compute `objectiveGovernanceScore`, `reformImpactScore`, `corruptionIndex` for each party
3. Write `app/data/party-objective-scores.json`

### `scripts/init-parties.ts`

```bash
npm run init-parties
```

Same pattern as `init-politicians.ts`:
- Call `initialize_party` for each party in `parties.ts`
- Idempotent (skip already-initialized)

---

## npm Scripts (full list)

```json
{
  "scrape":         "npx tsx scripts/scrape-janamat.ts",
  "init-politicians": "npx tsx scripts/init-politicians.ts",
  "init-parties":   "npx tsx scripts/init-parties.ts",
  "score-parties":  "npx tsx scripts/score-parties.ts",
  "setup":          "npm run anchor-build && npm run codama:js"
}
```

---

## Build Order (v2 — incremental from current state)

Current state: politician rating works on localnet. Parties page is UI-only.

```
Phase A — Party on-chain ratings
  A1. Add PartyAccount + PartyRatingAccount to lib.rs
  A2. npm run anchor-build → npm run codama:js (regenerates types)
  A3. Write scripts/init-parties.ts → npm run init-parties
  A4. Write use-party-ratings.ts hook
  A5. Wire PartyRatingForm into /party/[id] page
  A6. Test: connect wallet → rate a party → verify on-chain sums update

Phase B — ZK anonymous ratings ✅ DONE
  B1. ✅ NullifierAccount + AnonRatingAccount + submit_rating_anonymous in lib.rs
  B2. ✅ @zk-kit/poseidon-cipher installed
  B3. ✅ anchor build + codama:js regenerated
  B4. ✅ use-zk-rating.ts hook (politician + party) + app/lib/zk/nullifier.ts
  B5. ✅ Public/Anonymous toggle in RatingForm + PartyRatingForm (ZkModeToggle)
  B6. Test on localnet: anonymous rating → nullifier stored → second attempt rejected

Phase C — Enriched off-chain data
  C1. Add corruptionRecord + promisesTracked to all politicians in politicians.ts
  C2. Add majorScandals + majorReforms to all parties in parties.ts
  C3. Write app/data/party-scoring.ts
  C4. Write scripts/score-parties.ts → npm run score-parties
  C5. Update calcCompositeScore in scoring.ts to use integrityBonus
  C6. Build CorruptionCard, PromiseMeter, ScandalTimeline, ReformTimeline components

Phase D — Devnet + production deploy
  D1. anchor deploy --provider.cluster devnet
  D2. Update Anchor.toml + declare_id!() with new devnet Program ID
  D3. npm run codama:js (regenerate for new ID)
  D4. npm run init-politicians + npm run init-parties (on devnet)
  D5. npm run build → deploy to Vercel
```

---

## Key Security Constraints

- **Never target mainnet** unless Samrat explicitly confirms cluster in that session
- **No `init_if_needed`** on `RatingAccount` or `PartyRatingAccount` — prevents overwrite outside update path
- **Checked arithmetic** on all aggregate sums (integrity_sum, etc.)
- **Never hand-write** anything in `app/generated/` — always regenerate via Codama
- **Always go through `useSendTransaction`** — never hand-roll transaction sending
- **Nullifier namespace is shared** — the same nullifier cannot be reused across politician + party anonymous ratings
- **No `zk_verified = true` without a valid nullifier** — the flag must only be set via the `submit_rating_anonymous` path, not the standard path

---

## Known Data Gaps (manually fill)

The following fields need manual research and filling in `politicians.ts` and `parties.ts`:

- `corruptionRecord` for all 20 politicians → use [Jawafdehi.org](https://jawafdehi.org) + CIAA reports
- `promisesTracked` → use [Digital Pratikpashya](https://digitalpratipakshya.com/gov-monitoring) + election manifesto tracking
- `objectiveData.majorScandals` for NC, CPN-UML, CPN-MC → Lalita Niwas land grab, Pajero scandal, Patanjali land deal, Bhutanese refugee embezzlement
- `objectiveData.majorReforms` → 2015 constitution, 2017 federal restructuring, 2019 MCC compact, RSP anti-corruption bills
- `objectiveData.gdpGrowthDuringTenure` → World Bank Nepal data
- `objectiveData.billsPassedInLastTenure` → parliament records

---

## Janamat Data Pipeline — How the Poll Data Is Used

Janamat is the public-opinion signal of the app. It feeds the UI through **two independent paths**: a batch path (scraped scores baked into scoring) and a live path (polls fetched in the browser).

```
                    Janamat API (railway.app /api/v1/polls)
                          │                     │
        ┌─────────────────┘                     └──────────────────┐
        ▼  BATCH (npm run scrape)                 LIVE (browser)   ▼
  scripts/scrape-janamat.ts                app/janamat/client.ts
        │                                        fetchPoll(id) via SWR
        ▼                                               │
  app/data/janamat-scores.json                          ▼
        │                                  JanamatPollList.tsx
        ▼                                  (per-option bars, colored by
  getJanamatScore(id) → scoring.ts          classifyOptionSentiment)
  communityScore = janamat×0.5 + stars×0.5
```

### Path 1 — Batch: `scripts/scrape-janamat.ts` → `janamat-scores.json`

Run with `npm run scrape`. What it does, step by step:

1. **Fetch all polls** — paginated (`limit=50`, 300ms delay between pages) from the Janamat API
2. **Match polls to politicians** — `POLITICIAN_KEYWORDS` maps each politician id to Nepali + English keywords (e.g. `"balen-shah": ["बालेन", "Balen", …]`); a poll counts for a politician if any keyword appears in its title or option texts
3. **Compute per-poll approval** (`computeApproval`) — options containing positive keywords (support/yes/राम्रो/सही…) count fully toward approval, negative keywords (against/भ्रष्ट/गलत…) count zero, unmatched options count 50%
4. **Weight and aggregate** — each poll is weighted by `log(totalVotes + 1) × exp(−daysOld / 30)`, so big recent polls dominate and old polls decay with a 30-day half-life-ish falloff
5. **Write output** — `app/data/janamat-scores.json` as `Record<politicianId, number>` (0–100)

Consumed by `getJanamatScore(id)` in `politicians.ts` (returns **50 as the neutral default** for unscored politicians), which flows into:
- `communityScore = (janamatScore × 0.50) + (starScore × 0.50)` in the composite algorithm
- Every leaderboard, profile score ring, and party average derived from composites

**Keeping it fresh:** re-run `npm run scrape` whenever new polls land; when adding a politician to `politicians.ts`, also add a keyword entry to `POLITICIAN_KEYWORDS` or they'll silently stay at the neutral 50.

### Path 2 — Live: `JanamatPollList.tsx` (client-side, real-time)

`app/components/politician/JanamatPollList.tsx` takes `pollIds: number[]`, fetches each poll live via `fetchPoll(id)` (SWR-cached), and renders per-option vote bars colored by `classifyOptionSentiment` (red = positive, violet = negative, gray = neutral). Shows total votes + "Janamat Verified" tag; loading skeleton while fetching; renders nothing on fetch error.

**⚠️ Currently built but not wired in** — no page imports it. To activate: render `<JanamatPollList pollIds={politician.relatedPollIds} />` on `/politician/[id]` (a "Public Opinion / जनमत" section under Community Ratings). The `relatedPollIds` field on each politician exists exactly for this.

### Planned extensions (ties into Dynamic UI Data Requirements)

| Extension | How |
|---|---|
| Monthly approval trend (`approvalByMonth`) | Change scraper to append `{ month, scores }` snapshots to a dated JSON instead of overwriting — feeds the politician trend chart with real points |
| Party approval (`profile.approvalRating`) | Add a `PARTY_KEYWORDS` map (party names/leaders in Nepali + English) and aggregate matched polls the same way per party |
| Homepage sentiment split | Aggregate positive vs negative vote totals across all matched polls from the scrape output |

---

## Research Guide — Replacing Placeholder Politician & Party Data

**Why this section exists:** every politician and party record in the app right now is either hand-typed placeholder data or missing entirely. This is a checklist to work through offline, organized by *which file the answer goes into*, so research sessions can be self-contained — look up a fact, open the file, fill it in, move to the next row.

**Current state of the two data files** (checked directly against the code, 2026-07):

| File | Politicians/Parties covered | What's real | What's placeholder/missing |
|---|---|---|---|
| `app/data/politicians.ts` | 20 politicians | `name`, `nameNepali`, `party`, `role`, `constituency`, `electedYear` | `parliamentData` (attendance/bills) — plausible-looking but not sourced; `corruptionRecord` — **field doesn't exist on any record yet**; `promisesTracked` — **doesn't exist yet**; `relatedPollIds` — static field is `[]` on every entry (live poll IDs now come from the scraper separately, see below); `bio`, `imageUrl`, `socialLinks` — not populated |
| `app/data/parties.ts` | 6 parties (nc, cpn_uml, cpn_mc, rpp, rsn, janmat) | `name`, `nameNepali`, `shortName`, `color`, `seats`, `founded` | `objectiveData` — **doesn't exist yet** (no scandals, reforms, attendance, GDP data); `profile` (bio, president, achievements, controversies, attendanceByMonth) — **doesn't exist yet**, but the party detail page currently fakes this via a hardcoded `PARTY_DETAILS` map in the page component itself; `status` (active/registered/national) — doesn't exist, page hardcodes the same three pills on every card |
| `app/data/janamat-scores.json` + `related-polls.json` | 11 of 20 politicians | ✅ Live, auto-generated by `npm run scrape` — no manual work needed | 9 politicians have no keyword entry in `POLITICIAN_KEYWORDS` (scraper script) so they never get scored/linked — see Task 5 below |

### Task 1 — `app/data/politicians.ts`: verify `parliamentData` + add `corruptionRecord` + `promisesTracked`

For **each of the 20 politicians**, look up and fill:

```typescript
parliamentData: {
  attendancePercent: number   // verify against source, don't trust current placeholder value
  billsProposed: number
  billsPassed: number
  termStart: string           // ISO date, e.g. "2022-11-20"
  termEnd: string | null
}
corruptionRecord: {           // NEW — add this object to every politician
  casesRegistered: number     // total CIAA/court cases ever filed against them
  casesConvicted: number
  casesPending: number        // active investigations
  ciaaInvestigations: number  // CIAA-specific (subset of casesRegistered)
  assetGrowthPercent: number  // % change in declared assets since election; 0 if no data / no growth
}
promisesTracked: {             // NEW — add this object to every politician
  total: number                // election promises made
  fulfilled: number
  pending: number
  broken: number
}
```

**Where to look:**
- Attendance + bills → [Digital Pratipakshya — Parliament Watch](https://digitalpratipakshya.com/gov-monitoring)
- Corruption cases → [Jawafdehi.org](https://jawafdehi.org) (search by name) + [CIAA official reports](https://ciaa.gov.np) (PDF, manual)
- Promises → [Digital Pratipakshya](https://digitalpratipakshya.com/gov-monitoring) + the politician's original election manifesto (news archives)

**If you can't find a number:** use `0` for counts, and leave attendance/bills at the current placeholder rather than guessing — but flag it (e.g. a `// TODO: verify` comment) so it's not mistaken for a sourced figure later.

### Task 2 — `app/data/parties.ts`: add `objectiveData` to all 6 parties

```typescript
objectiveData: {
  memberAttendanceAvg: number           // avg attendance of the party's tracked MPs, 0–100
  billsPassedInLastTenure: number       // bills passed while this party was last in government
  gdpGrowthDuringTenure?: number        // % GDP growth during that same tenure — optional
  developmentProjectsCompleted: number  // major infra/social projects completed
  corruptionCasesAgainstMembers: number // CIAA/court cases against this party's MPs (count, not detail)
  electionPromises: { total: number, fulfilled: number, pending: number, broken: number }
  majorScandals: Array<{
    year: number
    title: string
    description: string                 // 1–2 sentences
    severity: 'minor' | 'major' | 'critical'
    resolved: boolean
    sourceUrl?: string
    pointDeduction: number              // suggested: minor=5, major=12, critical=20 (matches corruptionIndex formula)
  }>
  majorReforms: Array<{
    year: number
    title: string
    description: string
    impact: 'low' | 'medium' | 'high' | 'transformative'
    impactPoints: number                // suggested: low=5, medium=10, high=15, transformative=20
    sourceUrl?: string
  }>
}
```

**Known scandals/reforms to start from** (already named in this doc, need year/description/severity/sourceUrl filled in): Lalita Niwas land grab, Pajero scandal, Patanjali land deal, Bhutanese refugee embezzlement (scandals); 2015 constitution, 2017 federal restructuring, 2019 MCC compact, RSP anti-corruption bills (reforms) — attribute each to the correct party.

**Where to look:** [Election Commission Nepal](https://election.gov.np) (attendance, seats context), [World Bank Nepal](https://data.worldbank.org/country/nepal) (GDP), [OCCRP Nepal](https://www.occrp.org/en/countries/nepal) + [Kathmandu Post](https://kathmandupost.com) (scandal writeups), [Jawafdehi.org](https://jawafdehi.org) (cases against members).

### Task 3 — `app/data/parties.ts`: add `profile` per party (replaces the hardcoded `PARTY_DETAILS` in the page)

Right now `app/(routes)/party/[id]/page.tsx` has a `PARTY_DETAILS` object hand-written directly in the component for `cpn_uml`, `nc`, `cpn_mc`, `rsn`, `rpp`, `janmat` — bio, president, achievements, controversies are all placeholder text. This needs to move into `parties.ts` as real data:

```typescript
profile: {
  bio: string                       // 2–3 sentence real English intro
  president: string                 // current party president's actual name
  approvalRating: number            // 0–100 — pull from a Janamat aggregate once Task 5 extends to parties, or a national survey
  billsSponsored: number            // current parliament session, this party's MPs
  billsPassed: number
  attendanceByMonth: Array<{ month: string, percent: number }>  // last 6 months, real monthly data
  achievements: Array<{ year: number, title: string, description: string, sourceUrl?: string }>
  controversies: Array<{ year: number, title: string, description: string, status: 'Under Investigation' | 'Resolved' | 'Ongoing' | 'Court Case', sourceUrl?: string }>
}
```

### Task 4 — `app/data/parties.ts`: add `status` per party

```typescript
status: {
  active: boolean                       // fielding candidates in the current election cycle
  registered: boolean                   // ECN registration current/valid
  scope: 'national' | 'regional'        // ECN classification
}
```

**Where to look:** [Election Commission Nepal](https://election.gov.np) party register — this replaces the identical "Active / Registered / National" pills currently hardcoded on every card in `/party`.

### Task 5 — `scripts/scrape-janamat.ts`: add the 9 missing politician keywords

`POLITICIAN_KEYWORDS` in the scraper currently only has entries for 15 of the 20 politicians in `politicians.ts`. Any politician without an entry never gets a Janamat score (silently stays at neutral 50) or related polls. **Missing entries for:** `nanda-bahadur-pun`, `agni-prasad-sapkota`, `ramesh-lekhak`, `dev-gurung`, `pradeep-yadav`. Add a `[nepaliName, "English Name", "Common misspelling"]` array for each, following the existing pattern — and re-read the note at the top of that map about avoiding bare surnames (a past bug: `"Rabi"` alone matched an unrelated "Rabi Singh Kushwaha" candidate; a name like "Pun" or "Yadav" is an extremely common surname and must not be used alone). After adding entries, run `npm run scrape` to regenerate `janamat-scores.json` and `related-polls.json`.

### Task 6 (optional, lower priority) — homepage + trend chart data

These are documented above in "Dynamic UI Data Requirements" (`ticker.json`, `approvalByMonth`, `recentActions`) — lower priority than Tasks 1–5 since they affect cosmetic sections rather than the scoring algorithm's inputs.

### Suggested order

Tasks 1 and 2 feed the actual scoring formulas (`integrityBonus`, `corruptionIndex`, `reformImpactScore`) — do those first, since until they're filled every politician/party effectively scores as if it had a spotless record. Task 3–4 are visual/informational only (they don't change any score). Task 5 is quick and mechanical — do it any time.

---

## Reference Links

- [Jawafdehi CIAA Archive](https://jawafdehi.org)
- [Open Data Nepal](https://opendatanepal.com)
- [Digital Pratikpashya — Parliament Watch](https://digitalpratipakshya.com/gov-monitoring)
- [CIAA Official](https://ciaa.gov.np)
- [Light Protocol — ZK Compression](https://www.zkcompression.com)
- [Semaphore ZK Voting Pattern](https://hackmd.io/@vplasencia/B1sCrsoFkg)
- [Poseidon Cipher (zk-kit)](https://github.com/privacy-scaling-explorations/zk-kit)
- [Election Commission Nepal](https://election.gov.np)
- [OCCRP Nepal Corruption Coverage](https://www.occrp.org/en/countries/nepal)
- [Transparency International Nepal](https://www.transparency.org/en/countries/nepal)
