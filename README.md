# Rate My Neta 🇳🇵

**Civic accountability dApp for Nepal, built on Solana.**

Citizens rate politicians and political parties on integrity, performance, and reform impact. Ratings are stored as immutable on-chain aggregates. Anonymous voting is enforced with ZK Poseidon nullifiers — one vote per wallet per target, without linking a rating to a wallet address.

| | |
|---|---|
| **Network** | Solana Devnet |
| **Program ID** | [`DMmHWdzTeZwChv2uZbdqCDRECkP2WBQFttfY7xJYvVB5`](https://explorer.solana.com/address/DMmHWdzTeZwChv2uZbdqCDRECkP2WBQFttfY7xJYvVB5?cluster=devnet) |
| **Deploy authority** | `FcrKifd5HL356zXZ8agnsMSyLdFZgox65Jxe4JTC3avr` |
| **Politicians initialized** | 34 |
| **Parties initialized** | 8 (`nc`, `cpn_uml`, `cpn_mc`, `rpp`, `rsn`, `janmat`, `msp`, `ssp`) |

---

## Features

- **Politician ratings** — 4 categories (integrity, work ethic, promises kept, overall); 1 rating per wallet per politician; 24h update window for public ratings
- **Party ratings** — 5 categories (development, anti-corruption, popularity, reform effort, governance)
- **Anonymous (ZK) ratings** — wallet signs a fixed message off-chain; a Poseidon nullifier is derived and stored on-chain instead of the voter's address; reused nullifiers are rejected (double-vote prevention without identity)
- **Composite scoring** — on-chain community ratings blended with objective parliamentary data and Janamat poll sentiment
- **Live civic data** — leaderboards, party comparison, per-party legislative performance

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| Solana client | `@solana/kit` + wallet-standard (no `@solana/web3.js`) |
| Program client | Codama-generated from Anchor IDL (`app/generated/`) |
| On-chain program | Anchor — `anchor/programs/rate-my-politician/` |
| ZK hashing | `@zk-kit/poseidon-cipher` (Poseidon nullifiers) |
| Data fetching | SWR (30s polling of on-chain aggregates) |

---

## Quick Start (Frontend)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), select **devnet** in the cluster switcher, connect your wallet (Phantom / Solflare), and rate.

> The app defaults to **devnet** in the cluster selector. Make sure your wallet is on devnet and has a small SOL balance (`solana airdrop 2` on devnet).

---

## Prerequisites

- Node.js 20+
- [Rust](https://rustup.rs/), [Solana CLI](https://solana.com/docs/intro/installation), [Anchor](https://www.anchor-lang.com/docs/installation)
- A Solana wallet browser extension with message-signing support (required for anonymous mode)

---

## Local Development (localnet)

```bash
# 1. Install dependencies + build program + regenerate TS client
npm install
npm run setup          # anchor build + codama:js

# 2. Start a local validator (separate terminal)
solana-test-validator

# 3. Deploy to localnet
solana config set --url localhost
cd anchor && anchor deploy && cd ..

# 4. Initialize on-chain accounts
npm run init-politicians
npm run init-parties

# 5. Pull Janamat poll sentiment data
npm run scrape

# 6. Run the app
npm run dev
```

Switch the cluster selector to **localnet** in the app.

> Restarting `solana-test-validator` wipes all state. Re-run deploy + init scripts after a restart.

---

## Devnet Deployment

The program is **live on devnet**. To redeploy or set up a fresh cluster:

```bash
# 1. Point Solana CLI at devnet
solana config set --url devnet
solana airdrop 2   # repeat if needed

# 2. Build and deploy
cd anchor
anchor build
anchor deploy --provider.cluster devnet
# If anchor deploy hangs, use:
# solana program deploy target/deploy/rate_my_politician.so \
#   --program-id target/deploy/rate_my_politician-keypair.json --url devnet
cd ..

# 3. Regenerate TypeScript client (after any program ID change)
npm run codama:js

# 4. Initialize politician + party PDAs on devnet
RPC_URL=https://api.devnet.solana.com npm run init-politicians
RPC_URL=https://api.devnet.solana.com npm run init-parties

# 5. Refresh Janamat poll scores
npm run scrape

# 6. Run or build the frontend
npm run dev
# npm run build && npm run start
```

Init scripts read `RPC_URL` or `SOLANA_RPC_URL` (default: `http://127.0.0.1:8899` for localnet).

---

## npm Scripts

| Script | Description |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run setup` | `anchor build` + regenerate TypeScript client via Codama |
| `npm run codama:js` | Regenerate `app/generated/` only (after IDL changes) |
| `npm run init-politicians` | Create `PoliticianAccount` PDAs for all politicians |
| `npm run init-parties` | Create `PartyAccount` PDAs for all parties |
| `npm run scrape` | Fetch Janamat polls → `app/data/janamat-scores.json` |
| `npm run anchor-test` | Program tests (LiteSVM) |
| `npm run build` | Production build |

---

## Architecture

```
┌───────────────────────────  Browser  ────────────────────────────┐
│  Next.js App Router pages                                        │
│   /  /politicians  /party  /party/[id]  /politician/[id]         │
│        │                                                         │
│        ├── RatingForm / PartyRatingForm ── ZkModeToggle          │
│        │        │                              │                 │
│        │   Public mode                   Anonymous mode          │
│        │        │                              │                 │
│        │  use-ratings.ts              use-zk-rating.ts           │
│        │  use-party-ratings.ts        └─ zk/nullifier.ts         │
│        │        │                        (signMessage →          │
│        │        │                         Poseidon nullifier)    │
│        │        └────────┬────────────────────┘                  │
│        │                 ▼                                       │
│        │        useSendTransaction  ◄── wallet-standard          │
│        │                 │              (Phantom, Solflare…)     │
│        │        Codama-generated client (app/generated/)         │
└────────┼─────────────────┼───────────────────────────────────────┘
         │                 ▼  RPC (@solana/kit)
         │   ┌─────────  Solana cluster  ─────────────────┐
         │   │  rate-my-politician program (Anchor)       │
         │   │   PoliticianAccount   PartyAccount         │
         │   │   RatingAccount       PartyRatingAccount   │
         │   │   NullifierAccount    AnonRatingAccount(s) │
         │   └────────────────────────────────────────────┘
         ▼
  Curated off-chain data (app/data/): politicians.ts, parties.ts,
  janamat-scores.json (npm run scrape), scoring algorithms
```

**Data flow:** curated facts live in `app/data/`, citizen ratings live on-chain in PDAs, and pages blend both at render time. SWR polls the chain every 30 seconds; composite scores are computed client-side.

**PDA initialization:** rating instructions require the target aggregate account to already exist. `scripts/init-politicians.ts` and `scripts/init-parties.ts` create those PDAs idempotently, signed by your Solana CLI keypair (`~/.config/solana/id.json`).

---

## Scoring Algorithms

Scores are computed client-side in `app/data/scoring.ts` and displayed on leaderboards and profile pages. On-chain data provides citizen star ratings; off-chain JSON provides parliamentary records and Janamat poll sentiment.

### Politician Composite Score (implemented)

```
compositeScore (0–100) =
  (objectiveScore × 0.60) + (communityScore × 0.40)

objectiveScore =
  (attendancePercent × 0.40) + (billScore × 0.60)

billScore =
  min(billsProposed × 5, 50) + min(passRate × 0.5, 50)
  where passRate = (billsPassed / billsProposed) × 100  (0 if no bills)

communityScore =
  (janamatScore × 0.50) + (starScore × 0.50)

starScore =
  ((avg of 4 on-chain star categories) − 1) × 25   → maps 1–5 stars to 0–100

Grade:  A ≥ 80 | B ≥ 65 | C ≥ 50 | D ≥ 35 | F < 35
```

**Inputs:**
- `attendancePercent`, `billsProposed`, `billsPassed` — from `app/data/politicians.ts` (`parliamentData`)
- `janamatScore` — from `app/data/janamat-scores.json` (default **50** if no polls matched)
- `avgStars` — average of on-chain integrity / work ethic / promises kept / overall sums ÷ `total_ratings`

### Politician Composite Score (planned — v2)

A richer formula with corruption and promise tracking is specified in `requirements.md`:

```
compositeScore =
  (objectiveScore × 0.55) + (communityScore × 0.30) + (integrityBonus × 0.15)

integrityBonus = max(0, 100
  − casesConvicted × 25
  − ciaaInvestigations × 8
  − casesPending × 5
  − min(assetGrowthPercent / 2, 20)
  + (promisesFulfilled / max(promisesTotal, 1)) × 20
)
```

Requires `corruptionRecord` and `promisesTracked` fields on each politician record.

### Party Composite Score (planned — v2)

Four-pillar model from `requirements.md` (not yet in `app/data/party-scoring.ts`):

```
partyCompositeScore (0–100) =
  (communityRatingScore × 0.35) +
  (objectiveGovernanceScore × 0.30) +
  (reformImpactScore × 0.20) +
  (corruptionIndex × 0.15)

communityRatingScore =
  avg(5 on-chain categories) → normalize: (avg − 1) × 25

objectiveGovernanceScore =
  (memberAttendanceAvg × 0.40) + (billsPassedRate × 0.60)

reformImpactScore =
  min(sum of reform.impactPoints, 100)
  (transformative=20, high=15, medium=10, low=5)

corruptionIndex = max(0, 100
  − criticalScandals × 20
  − majorScandals × 12
  − minorScandals × 5
  − casesAgainstMembers × 3
)

Grade: A+ ≥ 88 | A ≥ 80 | B+ ≥ 72 | B ≥ 65 | C+ ≥ 58 | C ≥ 50 | D ≥ 35 | F < 35
```

---

## Janamat Poll Pipeline

Janamat public-opinion data feeds scoring through a batch scraper:

```
Janamat API → scripts/scrape-janamat.ts → app/data/janamat-scores.json
                                              ↓
                                    getJanamatScore(id) in politicians.ts
                                              ↓
                                    communityScore in composite formula
```

**Scraper steps** (`npm run scrape`):

1. Paginate all polls from the Janamat API (`limit=50`, 300ms delay between pages)
2. Match polls to politicians via `POLITICIAN_KEYWORDS` (Nepali + English name variants)
3. Compute per-poll approval — positive keywords (support/yes/राम्रो) count fully; negative keywords (against/भ्रष्ट) count zero; unmatched options count 50%
4. Weight each poll: `log(totalVotes + 1) × exp(−daysOld / 30)` — recent, high-participation polls dominate
5. Write `app/data/janamat-scores.json` as `Record<politicianId, number>` (0–100)

Re-run `npm run scrape` when new polls appear. Add keyword entries for any new politician in `scripts/scrape-janamat.ts`.

---

## Anonymous (ZK) Rating — Phase 1

Anonymous ratings use **Poseidon nullifiers** — no full ZK circuit yet, but double-vote prevention is enforced on-chain.

### Nullifier derivation

```
nullifier = Poseidon(secret, targetIdHash)

secret       = SHA-256(wallet_signature("rate-my-neta-v1"))  mod BN254 field
targetIdHash = SHA-256(politician_id or party_id)           mod BN254 field
```

Implementation: `app/lib/zk/nullifier.ts` using `@zk-kit/poseidon-cipher`.

### User flow

1. Select **🛡 Anonymous (ZK)** in the rating form
2. Wallet signs the fixed message `"rate-my-neta-v1"` (off-chain, free, deterministic per wallet)
3. Frontend computes the nullifier from signature + target ID
4. If a `NullifierAccount` PDA already exists → "already rated"
5. Otherwise submit `submit_rating_anonymous` or `submit_party_rating_anonymous`
6. Program stores nullifier + rating; **no wallet address** in the rating account
7. Same wallet + same target → same nullifier → second attempt rejected on-chain

### Privacy caveat (Phase 1)

The transaction **fee payer** is still visible on-chain. The rating itself is not linked to the voter's pubkey, but full unlinkability requires a burner wallet, relayer, or Phase 2 (Light Protocol compressed nullifiers). See `requirements.md` for the Phase 2 roadmap.

---

## On-Chain Program

**Program ID:** `DMmHWdzTeZwChv2uZbdqCDRECkP2WBQFttfY7xJYvVB5`

### Instructions

| Instruction | Description |
|---|---|
| `initialize_politician` | Admin creates aggregate PDA for a politician |
| `submit_rating` | Public rating (wallet-linked), 4 categories (1–5) |
| `update_rating` | Revise public rating within 24h |
| `initialize_party` | Admin creates aggregate PDA for a party |
| `submit_party_rating` | Public party rating, 5 categories (1–5) |
| `update_party_rating` | Revise party rating within 24h |
| `submit_rating_anonymous` | Anonymous politician rating via nullifier |
| `submit_party_rating_anonymous` | Anonymous party rating via nullifier |

### Account PDAs

| Account | Seeds | Purpose |
|---|---|---|
| `PoliticianAccount` | `["politician", id]` | Aggregate rating sums |
| `RatingAccount` | `["rating", id, voter]` | One public rating per wallet |
| `PartyAccount` | `["party", id]` | Aggregate party sums |
| `PartyRatingAccount` | `["party_rating", id, voter]` | One public party rating per wallet |
| `NullifierAccount` | `["nullifier", nullifier]` | Double-vote guard (shared namespace) |
| `AnonRatingAccount` | `["anon_rating", nullifier]` | Anonymous politician rating |
| `AnonPartyRatingAccount` | `["anon_party_rating", nullifier]` | Anonymous party rating |

### Security constraints

- No `init_if_needed` on rating accounts — prevents overwrite outside the update path
- Checked arithmetic on all aggregate sums
- Public ratings always have `zk_verified = false`; only the anonymous path may set ZK-linked ratings
- Nullifier namespace is shared — the same nullifier cannot be reused across politician and party anonymous paths
- Rating values must be 1–5 (enforced on-chain)

---

## Project Structure

```
├── app/
│   ├── (routes)/
│   │   ├── politician/[id]/     # Politician profile + rating form
│   │   ├── party/               # Party list + compare
│   │   ├── party/[id]/          # Party profile + rating form
│   │   └── how-it-works/        # Scoring + flow explainer
│   ├── components/
│   │   ├── politician/RatingForm.tsx
│   │   ├── party/PartyRatingForm.tsx
│   │   └── zk/ZkModeToggle.tsx
│   ├── data/
│   │   ├── politicians.ts       # 34 politician records
│   │   ├── parties.ts           # 8 party records
│   │   ├── janamat-scores.json  # Scraped poll scores
│   │   └── scoring.ts           # Composite score algorithms
│   ├── generated/               # Codama client — NEVER edit by hand
│   └── lib/
│       ├── hooks/use-ratings.ts
│       ├── hooks/use-party-ratings.ts
│       ├── hooks/use-zk-rating.ts
│       └── zk/nullifier.ts
├── anchor/programs/rate-my-politician/   # Anchor program (Rust)
├── scripts/
│   ├── init-politicians.ts
│   ├── init-parties.ts
│   └── scrape-janamat.ts
└── requirements.md              # Full product + data spec (v2 roadmap)
```

---

## Modifying the Program

After any change to `anchor/programs/rate-my-politician/src/lib.rs`:

```bash
npm run setup        # rebuild + regenerate TypeScript client
```

Never hand-edit `app/generated/` — it is overwritten by Codama.

For devnet redeploy after changes:

```bash
cd anchor && anchor build && anchor deploy --provider.cluster devnet && cd ..
npm run codama:js
```

---

## Data Sources

| Data | Source |
|---|---|
| Parliament attendance + bills | [Digital Pratipakshya](https://digitalpratipakshya.com/gov-monitoring) |
| CIAA corruption cases | [Jawafdehi.org](https://jawafdehi.org) |
| Election results + party seats | [Election Commission Nepal](https://election.gov.np) |
| Janamat polls | [Janamat API](https://janamat-backend-new-production.up.railway.app/api/v1/polls) |
| GDP / macro data | [World Bank Nepal](https://data.worldbank.org/country/nepal) |
| Corruption perception | [Transparency International](https://www.transparency.org/en/countries/nepal) |

---

## License

MIT — see repository for details.
