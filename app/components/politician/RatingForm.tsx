"use client";

import { useState } from "react";
import { toast } from "sonner";
import clsx from "clsx";
import { ZkModeToggle, type RatingMode } from "@/app/components/zk/ZkModeToggle";
import type { RatingFormValues } from "@/types";

interface StarInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

function StarInput({ label, value, onChange, disabled }: StarInputProps) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className={clsx(
              "text-2xl transition-all duration-150 transform hover:scale-110",
              disabled && "cursor-not-allowed opacity-50",
              (hovered || value) >= star
                ? "text-yellow-400"
                : "text-gray-300 dark:text-gray-600 hover:text-yellow-300/60"
            )}
          >
            ★
          </button>
        ))}
      </div>
      <span className="text-xs font-bold text-gray-455">{value > 0 ? `${value}/5` : ""}</span>
    </div>
  );
}

interface RatingFormProps {
  onSubmit: (values: RatingFormValues) => Promise<void>;
  onSubmitAnonymous?: (values: RatingFormValues) => Promise<void>;
  zkSupported?: boolean;
  disabled?: boolean;
}

export function RatingForm({ onSubmit, onSubmitAnonymous, zkSupported = false, disabled }: RatingFormProps) {
  const [values, setValues] = useState<RatingFormValues>({
    integrity: 0,
    workEthic: 0,
    promisesKept: 0,
    overall: 0,
  });
  const [mode, setMode] = useState<RatingMode>("public");
  const [submitting, setSubmitting] = useState(false);

  const isValid = Object.values(values).every((v) => v >= 1 && v <= 5);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      toast.error("Please rate all 4 categories");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "anonymous" && onSubmitAnonymous) {
        await onSubmitAnonymous(values);
        toast.success("Anonymous rating submitted — nullifier stored on-chain!");
      } else {
        await onSubmit(values);
        toast.success("Rating submitted on-chain!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {onSubmitAnonymous && (
        <ZkModeToggle
          mode={mode}
          onChange={setMode}
          zkSupported={zkSupported}
          disabled={disabled || submitting}
        />
      )}
      <StarInput
        label="Integrity"
        value={values.integrity}
        onChange={(v) => setValues((p) => ({ ...p, integrity: v }))}
        disabled={disabled || submitting}
      />
      <StarInput
        label="Work Ethic"
        value={values.workEthic}
        onChange={(v) => setValues((p) => ({ ...p, workEthic: v }))}
        disabled={disabled || submitting}
      />
      <StarInput
        label="Promises Kept"
        value={values.promisesKept}
        onChange={(v) => setValues((p) => ({ ...p, promisesKept: v }))}
        disabled={disabled || submitting}
      />
      <StarInput
        label="Overall Score"
        value={values.overall}
        onChange={(v) => setValues((p) => ({ ...p, overall: v }))}
        disabled={disabled || submitting}
      />
      <button
        type="submit"
        disabled={!isValid || submitting || disabled}
        className={clsx(
          "w-full py-3 px-4 rounded-full font-bold text-sm text-white transition-all cursor-pointer",
          isValid && !submitting && !disabled
            ? mode === "anonymous"
              ? "bg-violet-600 hover:bg-violet-700 shadow-sm"
              : "bg-[#dc2626] hover:bg-[#b91c1c] shadow-sm"
            : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
        )}
      >
        {submitting
          ? "Submitting to Solana..."
          : mode === "anonymous"
          ? "Submit Anonymously (ZK)"
          : "Submit Rating On-Chain"}
      </button>
    </form>
  );
}
