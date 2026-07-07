"use client";

import clsx from "clsx";

export type RatingMode = "public" | "anonymous";

interface ZkModeToggleProps {
  mode: RatingMode;
  onChange: (mode: RatingMode) => void;
  zkSupported: boolean;
  disabled?: boolean;
}

export function ZkModeToggle({ mode, onChange, zkSupported, disabled }: ZkModeToggleProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-0.5">
          {(["public", "anonymous"] as const).map((m) => (
            <button
              key={m}
              type="button"
              disabled={disabled || (m === "anonymous" && !zkSupported)}
              onClick={() => onChange(m)}
              className={clsx(
                "px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer",
                mode === m
                  ? m === "anonymous"
                    ? "bg-violet-600 text-white"
                    : "bg-[#dc2626] text-white"
                  : "text-gray-500 hover:text-gray-800",
                m === "anonymous" && !zkSupported && "opacity-40 cursor-not-allowed"
              )}
            >
              {m === "public" ? "Public" : "🛡 Anonymous (ZK)"}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-gray-400 leading-relaxed">
        {mode === "anonymous"
          ? "Your wallet signs a fixed message off-chain; a Poseidon nullifier is stored on-chain instead of your address. One anonymous rating per wallet per target."
          : "Your rating is linked to your wallet address and can be updated within 24 hours."}
        {!zkSupported && " (Anonymous mode requires a wallet with message-signing support.)"}
      </p>
    </div>
  );
}
