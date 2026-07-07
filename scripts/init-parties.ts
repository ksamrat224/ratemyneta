/**
 * One-time setup: initialize PartyAccount PDAs for all rated parties.
 * Run with: npm run init-parties
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
import { getInitializePartyInstructionAsync } from "../app/generated/rate-my-politician/instructions/initializeParty";
import { fetchMaybePartyAccount } from "../app/generated/rate-my-politician/accounts/partyAccount";
import { findPartyAccountPda } from "../app/generated/rate-my-politician/pdas/partyAccount";

const RPC_URL = "http://127.0.0.1:8899";

// All parties from app/data/parties.ts except "independent" (not a rateable party)
const PARTY_IDS = ["nc", "cpn_uml", "cpn_mc", "rpp", "rsn", "janmat"];

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

  for (const id of PARTY_IDS) {
    const [pda] = await findPartyAccountPda({ partyId: id });
    const existing = await fetchMaybePartyAccount(rpc, pda);

    if (existing.exists) {
      console.log(`  skip  ${id}`);
      continue;
    }

    const ix = await getInitializePartyInstructionAsync({
      authority,
      partyId: id,
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

  console.log("\nDone — all parties initialized.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
