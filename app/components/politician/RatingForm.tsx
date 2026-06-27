"use client";

import { useState } from "react";
import { toast } from "sonner";
import clsx from "clsx";
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
      <span className="w-32 text-sm text-gray-600 dark:text-gray-300">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className={clsx(
              "text-2xl transition-colors",
              disabled && "cursor-not-allowed opacity-50",
              (hovered || value) >= star
                ? "text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            )}
          >
            ★
          </button>
        ))}
      </div>
      <span className="text-sm text-gray-400">{value > 0 ? `${value}/5` : ""}</span>
    </div>
  );
}

interface RatingFormProps {
  onSubmit: (values: RatingFormValues) => Promise<void>;
  disabled?: boolean;
}

export function RatingForm({ onSubmit, disabled }: RatingFormProps) {
  const [values, setValues] = useState<RatingFormValues>({
    integrity: 0,
    workEthic: 0,
    promisesKept: 0,
    overall: 0,
  });
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
      await onSubmit(values);
      toast.success("Rating submitted on-chain!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        label="Overall"
        value={values.overall}
        onChange={(v) => setValues((p) => ({ ...p, overall: v }))}
        disabled={disabled || submitting}
      />
      <button
        type="submit"
        disabled={!isValid || submitting || disabled}
        className={clsx(
          "w-full py-2.5 px-4 rounded-lg font-semibold text-white transition-colors",
          isValid && !submitting && !disabled
            ? "bg-indigo-600 hover:bg-indigo-700"
            : "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
        )}
      >
        {submitting ? "Submitting…" : "Submit Rating On-Chain"}
      </button>
    </form>
  );
}
