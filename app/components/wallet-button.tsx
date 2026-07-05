"use client";

import { useState, useRef, useEffect } from "react";
import { useWallet } from "../lib/wallet/context";
import { useBalance } from "../lib/hooks/use-balance";
import { lamportsToSolString } from "../lib/lamports";
import { ellipsify } from "../lib/explorer";
import { useCluster } from "./cluster-context";

export function WalletButton() {
  const { connectors, connect, disconnect, wallet, status, error } =
    useWallet();

  const { getExplorerUrl } = useCluster();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const address = wallet?.account.address;
  const balance = useBalance(address);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status !== "connected") {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => (isOpen ? close() : open())}
          className="cursor-pointer rounded-full border border-white bg-white px-4 py-2 text-xs font-bold text-[#dc2626] shadow-sm transition hover:bg-white/95"
        >
          Connect Wallet
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border-low bg-card p-3 shadow-lg">
            <p className="mb-2 text-xs font-medium text-muted">
              Choose a wallet
            </p>
            <div className="space-y-1">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={async () => {
                    try {
                      await connect(connector.id);
                      close();
                    } catch {
                      // connection errors are surfaced through context state
                    }
                  }}
                  disabled={status === "connecting"}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition hover:bg-cream disabled:opacity-50 disabled:pointer-events-none"
                >
                  {connector.icon && (
                    <img
                      src={connector.icon}
                      alt=""
                      className="h-5 w-5 rounded"
                    />
                  )}
                  <span>{connector.name}</span>
                </button>
              ))}
            </div>
            {status === "connecting" && (
              <p className="mt-2 text-xs text-muted">Connecting...</p>
            )}
            {error != null && (
              <p className="mt-2 text-xs text-destructive">
                {error instanceof Error ? error.message : String(error)}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  const initial = address ? address.slice(0, 1).toUpperCase() : "S";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => (isOpen ? close() : open())}
        className="flex cursor-pointer items-center gap-2.5 rounded-full border border-white/25 bg-white/10 p-1 pr-3.5 text-xs text-white transition hover:bg-white/20"
      >
        <div className="h-8 w-8 rounded-full bg-linear-to-br from-white/30 to-white/10 flex items-center justify-center font-bold text-sm shrink-0 select-none text-white border border-white/20 shadow-inner">
          {initial}
        </div>
        <div className="flex flex-col text-left leading-tight">
          <span className="font-bold text-[10px] tracking-wide text-white">Connected</span>
          <span className="font-mono text-[9px] text-white/70">{ellipsify(address!, 4)}</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-linear-to-br from-[#dc2626] to-[#b91c1c] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center font-black text-lg text-white border-2 border-white/30 shadow-lg shrink-0">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-sm">My Wallet</p>
                <p className="text-white/70 font-mono text-xs truncate">{ellipsify(address!, 6)}</p>
              </div>
            </div>

            {/* Balance */}
            <div className="mt-4 rounded-xl bg-white/10 px-4 py-3 border border-white/10">
              <p className="text-white/60 text-[10px] font-medium uppercase tracking-widest mb-0.5">Balance</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-white text-2xl font-black tabular-nums">
                  {balance.lamports != null ? lamportsToSolString(balance.lamports) : "\u2014"}
                </span>
                <span className="text-white/60 text-sm font-medium">SOL</span>
              </div>
            </div>
          </div>

          {/* Address + actions */}
          <div className="p-4 space-y-3">
            {/* Full address box */}
            <div className="rounded-xl bg-accent/50 border border-border px-3 py-2.5">
              <p className="text-[10px] text-muted font-medium mb-1 uppercase tracking-wide">Address</p>
              <p className="break-all font-mono text-xs text-foreground leading-relaxed">{address}</p>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-1.5 cursor-pointer rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-semibold transition hover:bg-accent hover:border-border"
              >
                {copied ? (
                  <>
                    <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
              <a
                href={getExplorerUrl(`/address/${address}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-semibold transition hover:bg-accent"
              >
                <svg className="h-3.5 w-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Explorer
              </a>
            </div>

            {/* Disconnect */}
            <button
              onClick={() => {
                disconnect();
                close();
              }}
              className="w-full cursor-pointer rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs font-semibold text-destructive transition hover:bg-destructive/10 hover:border-destructive/40"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
