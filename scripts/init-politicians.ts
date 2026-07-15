/**
 * One-time setup: initialize PoliticianAccount PDAs for all 20 politicians.
 * Run with: npm run init-politicians
 *
 * Uses the local Solana keypair (~/.config/solana/id.json) as authority.
 * Safe to re-run — already-initialized accounts are skipped.
 */

import fs from "fs";
import os from "os";
import path from "path";
import {
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  signTransactionMessageWithSigners,
  getBase64EncodedWireTransaction,
} from "@solana/kit";
import { getInitializePoliticianInstructionAsync } from "../app/generated/rate-my-politician/instructions/initializePolitician";
import { fetchMaybePoliticianAccount } from "../app/generated/rate-my-politician/accounts/politicianAccount";
import { findPoliticianAccountPda } from "../app/generated/rate-my-politician/pdas/politicianAccount";

const RPC_URL =
  process.env.RPC_URL ??
  process.env.SOLANA_RPC_URL ??
  "http://127.0.0.1:8899";

const POLITICIAN_IDS = [
  "balen-shah",
  "rabi-lamichhane",
  "swarnim-wagle",
  "bhishmaraj-aangdambe",
  "sunil-lamsal",
  "rekha-sharma",
  "sudan-gurung",
  "pushpa-kamal-dahal",
  "kp-sharma-oli",
  "sher-bahadur-deuba",
  "rajendra-lingden",
  "nanda-bahadur-pun",
  "bishnu-paudel",
  "prakash-sharan-mahat",
  "agni-prasad-sapkota",
  "ramesh-lekhak",
  "madhav-kumar-nepal",
  "dev-gurung",
  "gagan-thapa",
  "pradeep-yadav",
  "ram-chandra-poudel",
  "kirti-agni-shakya",
  "suskant-mandal",
  "ghanasyal-ruvial",
  "arjun-narasingha-kc",
  "niranjan-sharma",
  "hembahadur-malla",
  "shailendra-kumar",
  "candra-kant-rawat",
  "gopal-kiran",
  "sujan-chauhan",
  "manish-kumar",
  "ramesh-chandan",
  "sanya-kumar",
];

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const keyPath = path.join(os.homedir(), ".config", "solana", "id.json");
  const keyBytes = new Uint8Array(JSON.parse(fs.readFileSync(keyPath, "utf8")));
  const authority = await createKeyPairSignerFromBytes(keyBytes);
  console.log(`Authority: ${authority.address}`);
  console.log(`RPC: ${RPC_URL}\n`);

  const rpc = createSolanaRpc(RPC_URL);

  for (const id of POLITICIAN_IDS) {
    const [pda] = await findPoliticianAccountPda({ politicianId: id });
    const existing = await fetchMaybePoliticianAccount(rpc, pda);

    if (existing.exists) {
      console.log(`  skip  ${id}`);
      continue;
    }

    const ix = await getInitializePoliticianInstructionAsync({
      authority,
      politicianId: id,
    });

    const { value: blockhash } = await rpc.getLatestBlockhash().send();

    const signedTx = await pipe(
      createTransactionMessage({ version: 0 }),
      (m) => setTransactionMessageFeePayerSigner(authority, m),
      (m) => setTransactionMessageLifetimeUsingBlockhash(blockhash, m),
      (m) => appendTransactionMessageInstructions([ix], m),
      (m) => signTransactionMessageWithSigners(m),
    );

    const encoded = getBase64EncodedWireTransaction(signedTx);
    const sig = await rpc
      .sendTransaction(encoded, {
        encoding: "base64",
        preflightCommitment: "confirmed",
      })
      .send();

    // Poll for confirmation (up to 30s)
    for (let i = 0; i < 30; i++) {
      await sleep(1000);
      const { value: statuses } = await rpc
        .getSignatureStatuses([sig])
        .send();
      const status = statuses[0];
      if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") {
        break;
      }
    }

    console.log(`  init  ${id} — ${sig}`);
  }

  console.log("\nDone — all politicians initialized.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
