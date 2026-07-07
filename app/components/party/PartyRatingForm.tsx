"use client";

import { useState } from "react";
import { toast } from "sonner";
import clsx from "clsx";
import { ZkModeToggle, type RatingMode } from "@/app/components/zk/ZkModeToggle";
import type { PartyRatingFormValues } from "@/types";

const CATEGORIES: { key: keyof PartyRatingFormValues; label: string; description: string }[] = [
  { key: "development", label: "Development", description: "Infrastructure, education, healthcare progress" },
  { key: "antiCorruption", label: "Anti-Corruption", description: "Internal accountability and clean governance" },
  { key: "popularity", label: "Popularity", description: "Overall public satisfaction and approval" },
  { key: "reformEffort", label: "Reform Effort", description: "Policy innovation and meaningful change" },
  { key: "governance", label: "Governance", description: "Democratic process, transparency, rule of law" },
];

function StarInput({
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">{label}</div>
        <div className="text-[10px] text-gray-400 mt-0.5">{description}</div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className={clsx(
              "text-xl transition-all duration-100 transform hover:scale-110 cursor-pointer",
              disabled && "cursor-not-allowed opacity-50",
              (hovered || value) >= star
                ? "text-yellow-400"
                : "text-gray-200 hover:text-yellow-300/60"
            )}
          >
            ★
          </button>
        ))}
        <span className="text-xs font-bold text-gray-400 w-7 text-right">
          {value > 0 ? `${value}/5` : ""}
        </span>
      </div>
    </div>
  );
}

interface PartyRatingFormProps {
  onSubmit: (values: PartyRatingFormValues) => Promise<void>;
  onSubmitAnonymous?: (values: PartyRatingFormValues) => Promise<void>;
  zkSupported?: boolean;
  disabled?: boolean;
}

export function PartyRatingForm({ onSubmit, onSubmitAnonymous, zkSupported = false, disabled }: PartyRatingFormProps) {
  const [values, setValues] = useState<PartyRatingFormValues>({
    development: 0,
    antiCorruption: 0,
    popularity: 0,
    reformEffort: 0,
    governance: 0,
  });
  const [mode, setMode] = useState<RatingMode>("public");
  const [submitting, setSubmitting] = useState(false);

  const isValid = Object.values(values).every((v) => v >= 1 && v <= 5);

  function set(key: keyof PartyRatingFormValues, v: number) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      toast.error("Please rate all 5 categories");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "anonymous" && onSubmitAnonymous) {
        await onSubmitAnonymous(values);
        toast.success("Anonymous party rating submitted — nullifier stored on-chain!");
      } else {
        await onSubmit(values);
        toast.success("Party rating submitted on-chain!");
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
      {CATEGORIES.map(({ key, label, description }) => (
        <StarInput
          key={key}
          label={label}
          description={description}
          value={values[key]}
          onChange={(v) => set(key, v)}
          disabled={disabled || submitting}
        />
      ))}

      <button
        type="submit"
        disabled={!isValid || submitting || disabled}
        className={clsx(
          "w-full py-3 px-4 rounded-xl font-bold text-sm text-white transition-all cursor-pointer mt-2",
          isValid && !submitting && !disabled
            ? mode === "anonymous"
              ? "bg-violet-600 hover:bg-violet-700 shadow-sm"
              : "bg-[#dc2626] hover:bg-[#b91c1c] shadow-sm"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        )}
      >
        {submitting
          ? "Submitting to Solana..."
          : mode === "anonymous"
          ? "Submit Anonymously (ZK)"
          : "Submit Party Rating On-Chain"}
      </button>
    </form>
  );
}
