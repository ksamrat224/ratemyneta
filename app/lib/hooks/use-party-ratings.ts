"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { createSolanaRpc } from "@solana/kit";
import { useSendTransaction } from "./use-send-transaction";
import { useWallet } from "../wallet/context";
import { useCluster } from "../../components/cluster-context";
import { getClusterUrl } from "../solana-client";
import {
  fetchMaybePartyAccount,
  fetchMaybePartyRatingAccount,
} from "../../generated/rate-my-politician/accounts";
import {
  getSubmitPartyRatingInstructionAsync,
  getUpdatePartyRatingInstruction,
} from "../../generated/rate-my-politician/instructions";
import {
  findPartyAccountPda,
  findPartyRatingAccountPda,
} from "../../generated/rate-my-politician/pdas";
import type { PartyRatingFormValues, PartyAverages } from "@/types";

function useRpc() {
  const { cluster } = useCluster();
  return createSolanaRpc(getClusterUrl(cluster));
}

export function usePartyRatings(partyId: string) {
  const rpc = useRpc();
  const { signer } = useWallet();

  const { data: partyData, mutate: refreshParty } = useSWR(
    ["party", partyId],
    async () => {
      const [pda] = await findPartyAccountPda({ partyId });
      const account = await fetchMaybePartyAccount(rpc, pda);
      if (!account.exists) return null;
      return account.data;
    },
    { refreshInterval: 30_000 }
  );

  const { data: hasRated, mutate: refreshRating } = useSWR(
    signer ? ["party_rating", partyId, signer.address] : null,
    async () => {
      if (!signer) return false;
      const [pda] = await findPartyRatingAccountPda({
        partyId,
        voter: signer.address,
      });
      const account = await fetchMaybePartyRatingAccount(rpc, pda);
      return account.exists;
    }
  );

  const averages: PartyAverages | null = partyData
    ? (() => {
        const total = Number(partyData.totalRatings);
        if (total === 0) return null;
        return {
          development: Number(partyData.developmentSum) / total,
          antiCorruption: Number(partyData.antiCorruptionSum) / total,
          popularity: Number(partyData.popularitySum) / total,
          reformEffort: Number(partyData.reformEffortSum) / total,
          governance: Number(partyData.governanceSum) / total,
          totalRatings: total,
        };
      })()
    : null;

  const { send, isSending } = useSendTransaction();
  const [error, setError] = useState<string | null>(null);

  const submitRating = useCallback(
    async (values: PartyRatingFormValues) => {
      if (!signer) throw new Error("Wallet not connected");
      setError(null);
      try {
        const ix = await getSubmitPartyRatingInstructionAsync({
          voter: signer,
          partyId,
          development: values.development,
          antiCorruption: values.antiCorruption,
          popularity: values.popularity,
          reformEffort: values.reformEffort,
          governance: values.governance,
        });
        await send({ instructions: [ix] });
        await Promise.all([refreshParty(), refreshRating()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Transaction failed");
        throw err;
      }
    },
    [signer, partyId, send, refreshParty, refreshRating]
  );

  const updateRating = useCallback(
    async (values: PartyRatingFormValues) => {
      if (!signer) throw new Error("Wallet not connected");
      setError(null);
      try {
        const [partyPda] = await findPartyAccountPda({ partyId });
        const [ratingPda] = await findPartyRatingAccountPda({
          partyId,
          voter: signer.address,
        });
        const ix = getUpdatePartyRatingInstruction({
          voter: signer,
          partyAccount: partyPda,
          partyRatingAccount: ratingPda,
          development: values.development,
          antiCorruption: values.antiCorruption,
          popularity: values.popularity,
          reformEffort: values.reformEffort,
          governance: values.governance,
        });
        await send({ instructions: [ix] });
        await Promise.all([refreshParty(), refreshRating()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Transaction failed");
        throw err;
      }
    },
    [signer, partyId, send, refreshParty, refreshRating]
  );

  const refreshData = useCallback(() => {
    refreshParty();
    refreshRating();
  }, [refreshParty, refreshRating]);

  return {
    averages,
    userHasRated: hasRated ?? false,
    submitting: isSending,
    error,
    submitRating,
    updateRating,
    refreshData,
  };
}
