"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { createSolanaRpc } from "@solana/kit";
import { useSendTransaction } from "./use-send-transaction";
import { useWallet } from "../wallet/context";
import { useCluster } from "../../components/cluster-context";
import { getClusterUrl } from "../solana-client";
import {
  fetchMaybePoliticianAccount,
  fetchMaybeRatingAccount,
} from "../../generated/rate-my-politician/accounts";
import {
  getSubmitRatingInstructionAsync,
  getUpdateRatingInstruction,
} from "../../generated/rate-my-politician/instructions";
import {
  findPoliticianAccountPda,
  findRatingAccountPda,
} from "../../generated/rate-my-politician/pdas";
import type { RatingFormValues, PoliticianAverages } from "@/types";

function useRpc() {
  const { cluster } = useCluster();
  return createSolanaRpc(getClusterUrl(cluster));
}

export function usePoliticianRatings(politicianId: string) {
  const rpc = useRpc();
  const { signer } = useWallet();

  const { data: politicianData, mutate: refreshPolitician } = useSWR(
    ["politician", politicianId],
    async () => {
      const [pda] = await findPoliticianAccountPda({ politicianId });
      const account = await fetchMaybePoliticianAccount(rpc, pda);
      if (!account.exists) return null;
      return account.data;
    },
    { refreshInterval: 30_000 }
  );

  const { data: hasRated, mutate: refreshRating } = useSWR(
    signer ? ["rating", politicianId, signer.address] : null,
    async () => {
      if (!signer) return false;
      const [pda] = await findRatingAccountPda({
        politicianId,
        voter: signer.address,
      });
      const account = await fetchMaybeRatingAccount(rpc, pda);
      return account.exists;
    }
  );

  const averages: PoliticianAverages | null = politicianData
    ? (() => {
        const total = Number(politicianData.totalRatings);
        if (total === 0) return null;
        return {
          integrity: Number(politicianData.integritySum) / total,
          workEthic: Number(politicianData.workEthicSum) / total,
          promisesKept: Number(politicianData.promisesKeptSum) / total,
          overall: Number(politicianData.overallSum) / total,
          totalRatings: total,
        };
      })()
    : null;

  const { send, isSending } = useSendTransaction();
  const [error, setError] = useState<string | null>(null);

  const submitRating = useCallback(
    async (values: RatingFormValues) => {
      if (!signer) throw new Error("Wallet not connected");
      setError(null);
      try {
        const ix = await getSubmitRatingInstructionAsync({
          voter: signer,
          politicianId,
          integrity: values.integrity,
          workEthic: values.workEthic,
          promisesKept: values.promisesKept,
          overall: values.overall,
        });
        await send({ instructions: [ix] });
        await Promise.all([refreshPolitician(), refreshRating()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Transaction failed");
        throw err;
      }
    },
    [signer, politicianId, send, refreshPolitician, refreshRating]
  );

  const updateRating = useCallback(
    async (values: RatingFormValues) => {
      if (!signer) throw new Error("Wallet not connected");
      setError(null);
      try {
        const [politicianPda] = await findPoliticianAccountPda({ politicianId });
        const [ratingPda] = await findRatingAccountPda({
          politicianId,
          voter: signer.address,
        });
        const ix = getUpdateRatingInstruction({
          voter: signer,
          politicianAccount: politicianPda,
          ratingAccount: ratingPda,
          integrity: values.integrity,
          workEthic: values.workEthic,
          promisesKept: values.promisesKept,
          overall: values.overall,
        });
        await send({ instructions: [ix] });
        await Promise.all([refreshPolitician(), refreshRating()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Transaction failed");
        throw err;
      }
    },
    [signer, politicianId, send, refreshPolitician, refreshRating]
  );

  const refreshData = useCallback(() => {
    refreshPolitician();
    refreshRating();
  }, [refreshPolitician, refreshRating]);

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
