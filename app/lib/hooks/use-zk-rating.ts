"use client";

import { useState, useCallback } from "react";
import { useSWRConfig } from "swr";
import { createSolanaRpc } from "@solana/kit";
import { useSendTransaction } from "./use-send-transaction";
import { useWallet } from "../wallet/context";
import { useCluster } from "../../components/cluster-context";
import { getClusterUrl } from "../solana-client";
import { fetchMaybeNullifierAccount } from "../../generated/rate-my-politician/accounts";
import {
  getSubmitRatingAnonymousInstructionAsync,
  getSubmitPartyRatingAnonymousInstructionAsync,
} from "../../generated/rate-my-politician/instructions";
import { findNullifierAccountPda } from "../../generated/rate-my-politician/pdas";
import { computeNullifier, ZK_SIGN_MESSAGE } from "../zk/nullifier";
import type { RatingFormValues, PartyRatingFormValues } from "@/types";

function useRpc() {
  const { cluster } = useCluster();
  return createSolanaRpc(getClusterUrl(cluster));
}

/**
 * Shared plumbing for the anonymous (ZK nullifier) rating path:
 * sign fixed message → derive Poseidon nullifier → reject if already used.
 */
function useNullifier() {
  const rpc = useRpc();
  const { wallet } = useWallet();

  const zkSupported = Boolean(wallet?.signMessage);

  const deriveNullifier = useCallback(
    async (targetId: string) => {
      if (!wallet?.signMessage) {
        throw new Error("Connected wallet does not support message signing");
      }
      const signature = await wallet.signMessage(
        new TextEncoder().encode(ZK_SIGN_MESSAGE)
      );
      const nullifier = await computeNullifier(signature, targetId);

      const [pda] = await findNullifierAccountPda({ nullifier });
      const existing = await fetchMaybeNullifierAccount(rpc, pda);
      if (existing.exists) {
        throw new Error(
          "You have already rated this target anonymously — double-voting is prevented by your ZK nullifier"
        );
      }
      return nullifier;
    },
    [wallet, rpc]
  );

  return { zkSupported, deriveNullifier };
}

/** Anonymous politician rating via ZK nullifier. */
export function useZkRating(politicianId: string) {
  const { signer } = useWallet();
  const { zkSupported, deriveNullifier } = useNullifier();
  const { send, isSending } = useSendTransaction();
  const { mutate } = useSWRConfig();
  const [error, setError] = useState<string | null>(null);

  const submitAnonymous = useCallback(
    async (values: RatingFormValues) => {
      if (!signer) throw new Error("Wallet not connected");
      setError(null);
      try {
        const nullifier = await deriveNullifier(politicianId);
        const ix = await getSubmitRatingAnonymousInstructionAsync({
          payer: signer,
          politicianId,
          nullifier,
          integrity: values.integrity,
          workEthic: values.workEthic,
          promisesKept: values.promisesKept,
          overall: values.overall,
        });
        await send({ instructions: [ix] });
        await mutate(["politician", politicianId]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Transaction failed");
        throw err;
      }
    },
    [signer, politicianId, deriveNullifier, send, mutate]
  );

  return { zkSupported, submitAnonymous, submittingAnon: isSending, error };
}

/** Anonymous party rating via ZK nullifier. */
export function useZkPartyRating(partyId: string) {
  const { signer } = useWallet();
  const { zkSupported, deriveNullifier } = useNullifier();
  const { send, isSending } = useSendTransaction();
  const { mutate } = useSWRConfig();
  const [error, setError] = useState<string | null>(null);

  const submitAnonymous = useCallback(
    async (values: PartyRatingFormValues) => {
      if (!signer) throw new Error("Wallet not connected");
      setError(null);
      try {
        const nullifier = await deriveNullifier(partyId);
        const ix = await getSubmitPartyRatingAnonymousInstructionAsync({
          payer: signer,
          partyId,
          nullifier,
          development: values.development,
          antiCorruption: values.antiCorruption,
          popularity: values.popularity,
          reformEffort: values.reformEffort,
          governance: values.governance,
        });
        await send({ instructions: [ix] });
        await mutate(["party", partyId]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Transaction failed");
        throw err;
      }
    },
    [signer, partyId, deriveNullifier, send, mutate]
  );

  return { zkSupported, submitAnonymous, submittingAnon: isSending, error };
}
