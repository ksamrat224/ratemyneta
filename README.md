# Rate My Neta 🇳🇵

**Civic accountability dApp for Nepal, built on Solana.** Citizens rate politicians and political parties on integrity, performance, and reform impact. Ratings are immutable on-chain aggregates; anonymous voting is enforced with ZK Poseidon nullifiers so nobody can double-vote — and nobody has to attach their identity to a rating.

## Features

- **Politician ratings** — 4 categories (integrity, work ethic, promises kept, overall), 1 rating per wallet per politician, 24h update window
- **Party ratings** — 5 categories (development, anti-corruption, popularity, reform effort, governance)
- **Anonymous (ZK) ratings** — wallet signs a fixed message off-chain, a Poseidon nullifier is derived and stored on-chain instead of the voter's address; a reused nullifier is rejected by the program (double-vote prevention without identity)
- **Composite scoring** — on-chain community ratings blended with objective data (parliament attendance, bills, Janamat poll sentiment, corruption records)
- **Live civic data** — leaderboards, party comparison, per-party legislative performance

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| Solana client | `@solana/kit` + wallet-standard (no `@solana/web3.js`) |
| Program client | Codama-generated from the Anchor IDL (`app/generated/`) |
| On-chain program | Anchor — `anchor/programs/rate-my-politician/` |
| ZK hashing | `@zk-kit/poseidon-cipher` (Poseidon nullifiers) |
| Data fetching | SWR (30s polling of on-chain aggregates) |

## Prerequisites

- Node.js 20+
- [Rust](https://rustup.rs/), [Solana CLI](https://solana.com/docs/intro/installation), [Anchor](https://www.anchor-lang.com/docs/installation)
- A Solana wallet browser extension (Phantom, Solflare, …) — anonymous mode needs message-signing support (Phantom has it)

## Setup & Run (localnet)

```bash
# 1. Install dependencies
npm install

# 2. Build the Anchor program + generate the TypeScript client
npm run setup          # = anchor build + codama:js

# 3. Start a local validator (separate terminal, keep running)
solana-test-validator

# 4. Deploy the program to localnet
solana config set --url localhost
cd anchor && anchor deploy && cd ..

# 5. Initialize on-chain accounts (one PDA per politician/party)
npm run init-politicians
npm run init-parties

# 6. Pull Janamat poll sentiment data
npm run scrape

# 7. Run the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), switch the cluster selector to **localnet**, connect your wallet, and rate.

> **If you restart `solana-test-validator`**, all state is wiped: re-run `anchor deploy`, `npm run init-politicians`, and `npm run init-parties`.

## npm Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run setup` | `anchor build` + regenerate TypeScript client via Codama |
| `npm run codama:js` | Regenerate `app/generated/` only (after IDL changes) |
| `npm run init-politicians` | Create `PoliticianAccount` PDAs (one per politician in `app/data/politicians.ts`) |
| `npm run init-parties` | Create `PartyAccount` PDAs (one per party in `app/data/parties.ts`) |
| `npm run scrape` | Fetch Janamat polls → `app/data/janamat-scores.json` |
| `npm run anchor-test` | Program tests (LiteSVM) |
| `npm run build` | Production build |

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

**Data flow in one sentence:** curated facts live in `app/data/`, citizen ratings live on-chain in PDAs, and pages blend both at render time (SWR polls the chain every 30s; composite scores are computed client-side).

**PDA initialization:** rating instructions require the target's aggregate account (`PoliticianAccount` / `PartyAccount`) to already exist — that's what `scripts/init-politicians.ts` and `scripts/init-parties.ts` do. Both are idempotent (already-initialized PDAs are skipped) and sign with your local Solana CLI keypair (`~/.config/solana/id.json`) as authority. Run them once per cluster, and again any time you wipe the local validator.

## How Anonymous (ZK) Rating Works

1. You pick **🛡 Anonymous (ZK)** in the rating form
2. Your wallet signs the fixed message `"rate-my-neta-v1"` — off-chain, free, deterministic
3. The frontend computes `nullifier = Poseidon(sha256(signature), sha256(target_id))` (`app/lib/zk/nullifier.ts`)
4. If a `NullifierAccount` PDA for that nullifier exists, you're told you already rated — otherwise the `submit_rating_anonymous` transaction is sent
5. The program stores the nullifier + rating; the rating account contains **no wallet address**
6. Same wallet + same target always derives the same nullifier → a second attempt fails on-chain

**Phase 1 caveat:** the transaction fee payer is still visible on-chain. The rating is unlinked from your address, but full unlinkability needs a burner wallet/relayer (or the planned Light Protocol Phase 2 — see `requirements.md`).

## Program Accounts

| Account | PDA seeds | Purpose |
|---|---|---|
| `PoliticianAccount` | `["politician", id]` | Aggregate rating sums |
| `RatingAccount` | `["rating", id, voter]` | One public rating per wallet |
| `PartyAccount` | `["party", id]` | Aggregate party sums |
| `PartyRatingAccount` | `["party_rating", id, voter]` | One public party rating per wallet |
| `NullifierAccount` | `["nullifier", nullifier]` | Double-vote guard (shared namespace) |
| `AnonRatingAccount` | `["anon_rating", nullifier]` | Anonymous politician rating |
| `AnonPartyRatingAccount` | `["anon_party_rating", nullifier]` | Anonymous party rating |

## Project Structure

```
├── app/
│   ├── (routes)/
│   │   ├── politician/[id]/    # Politician profile + rating form
│   │   ├── party/              # Party list + compare
│   │   └── party/[id]/         # Party profile + rating form
│   ├── components/
│   │   ├── politician/RatingForm.tsx     # 4-category form + ZK toggle
│   │   ├── party/PartyRatingForm.tsx     # 5-category form + ZK toggle
│   │   └── zk/ZkModeToggle.tsx           # Public / Anonymous switch
│   ├── data/                   # Curated JSON/TS data (politicians, parties, scoring)
│   ├── generated/              # Codama client — NEVER edit by hand
│   └── lib/
│       ├── hooks/use-ratings.ts        # Public politician rating hook
│       ├── hooks/use-party-ratings.ts  # Public party rating hook
│       ├── hooks/use-zk-rating.ts      # Anonymous (nullifier) rating hooks
│       ├── zk/nullifier.ts             # Poseidon nullifier derivation
│       └── wallet/                     # wallet-standard connection + signMessage
├── anchor/programs/rate-my-politician/ # Anchor program (Rust)
├── scripts/                    # init-politicians, scrape-janamat, …
└── requirements.md             # Full product + data spec
```

## Deploying to Devnet

```bash
solana config set --url devnet
solana airdrop 2
cd anchor
anchor build
anchor keys sync      # sync program ID into source
anchor build          # rebuild with the new ID
anchor deploy
cd ..
npm run codama:js     # regenerate client for the new program ID
npm run init-politicians
npm run init-parties
```

> Note: the init scripts point at `http://127.0.0.1:8899` — change `RPC_URL` at the top of `scripts/init-*.ts` to `https://api.devnet.solana.com` when initializing on devnet.

Then select **devnet** in the app's cluster switcher.

## Modifying the Program

After any change to `anchor/programs/rate-my-politician/src/lib.rs`:

```bash
npm run setup        # rebuild + regenerate the TypeScript client
```

Never hand-edit `app/generated/` — it is overwritten by Codama.

## Data Sources

Curated off-chain data (see `requirements.md` for full schemas): [Jawafdehi](https://jawafdehi.org) (CIAA cases), [Digital Pratipakshya](https://digitalpratipakshya.com/gov-monitoring) (parliament attendance), [Election Commission Nepal](https://election.gov.np), Janamat polls API.
