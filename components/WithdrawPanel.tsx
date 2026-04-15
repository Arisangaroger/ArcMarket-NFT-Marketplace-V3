"use client";
import React from "react";
import { Banknote, TrendingUp, Loader2, CheckCircle2, AlertCircle, ExternalLink, Info } from "lucide-react";
import type { TxState, ProceedsState } from "@/types";
import { txUrl } from "@/lib/utils";

interface Props {
  proceeds: ProceedsState;
  withdrawTx: TxState;
  explorerUrl: string | null;
  isBusy: boolean;
  walletConnected: boolean;
  isCorrectNetwork: boolean;
  onWithdraw: () => void;
  onDismiss: () => void;
  chainId: number | null;
  variant?: "card" | "inline";
}

export default function WithdrawPanel({ proceeds, withdrawTx, explorerUrl, isBusy, walletConnected, isCorrectNetwork, onWithdraw, onDismiss, chainId, variant = "card" }: Props) {
  const hasProceeds = proceeds.amount > BigInt(0);
  const isSuccess   = withdrawTx.status === "success";
  const isError     = withdrawTx.status === "error";

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{
      background: hasProceeds
        ? "linear-gradient(135deg,rgba(22,46,30,0.9) 0%,rgba(13,24,18,0.95) 100%)"
        : "linear-gradient(135deg,rgba(22,22,46,0.9) 0%,rgba(13,13,24,0.95) 100%)",
      border: hasProceeds ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(124,58,237,0.12)",
      boxShadow: hasProceeds ? "0 0 30px rgba(34,197,94,0.1)" : "none",
    }}>
      {/* Gradient top bar */}
      {hasProceeds && (
        <div className="h-[2px]" style={{ background: "linear-gradient(90deg,transparent,#22C55E,#16A34A,transparent)" }} />
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{
              background: hasProceeds ? "rgba(34,197,94,0.15)" : "rgba(124,58,237,0.1)",
              border: hasProceeds ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(124,58,237,0.2)",
            }}>
              <Banknote className={`w-5 h-5 ${hasProceeds ? "text-green" : "text-violet-light"}`} />
            </div>
            <div>
              <p className="font-sans font-semibold text-pearl">Seller Earnings</p>
              <p className="font-mono text-[11px] text-pearl-faint mt-0.5">Proceeds from your sales</p>
            </div>
          </div>
          {hasProceeds && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)" }}>
              <TrendingUp className="w-3 h-3 text-green" />
              <span className="font-mono text-[10px] text-green uppercase tracking-wider">Claimable</span>
            </div>
          )}
        </div>

        {/* Amount display */}
        <div className="p-5 rounded-2xl text-center mb-5"
          style={{
            background: hasProceeds ? "rgba(34,197,94,0.08)" : "rgba(22,22,46,0.5)",
            border: hasProceeds ? "1px solid rgba(34,197,94,0.15)" : "1px solid rgba(82,82,128,0.15)",
          }}>
          {proceeds.isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 text-pearl-faint animate-spin" />
              <span className="font-sans text-sm text-pearl-faint">Loading…</span>
            </div>
          ) : (
            <>
              <p className="font-display text-5xl font-bold leading-none mb-1"
                style={{ color: hasProceeds ? "#22C55E" : "#525280" }}>
                {proceeds.amountEth}
              </p>
              <p className="font-mono text-xs text-pearl-faint">ETH available to withdraw</p>
            </>
          )}
        </div>

        {/* How it works */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl mb-5"
          style={{ background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.12)" }}>
          <Info className="w-3.5 h-3.5 text-cyan flex-shrink-0 mt-0.5" />
          <p className="font-sans text-xs text-pearl-faint leading-relaxed">
            When buyers purchase your NFTs, ETH is held securely. Call <span className="text-cyan font-mono">withdrawProceeds()</span> to transfer it to your wallet.
          </p>
        </div>

        {/* Error */}
        {isError && (
          <div className="flex items-center gap-2 p-3 rounded-xl mb-4"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle className="w-4 h-4 text-red flex-shrink-0" />
            <p className="font-mono text-xs text-red flex-1">{withdrawTx.error}</p>
            <button onClick={onDismiss} className="text-pearl-faint hover:text-pearl text-xs">✕</button>
          </div>
        )}

        {/* Success */}
        {isSuccess && (
          <div className="flex items-start gap-3 p-3 rounded-xl mb-4"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <CheckCircle2 className="w-4 h-4 text-green flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-sans text-sm font-semibold text-green">Withdrawn successfully!</p>
              {explorerUrl && (
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-violet-light hover:underline mt-0.5">
                  View transaction <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
            <button onClick={onDismiss} className="text-pearl-faint hover:text-pearl text-xs">✕</button>
          </div>
        )}

        {/* CTA */}
        {!walletConnected ? (
          <div className="py-3.5 text-center rounded-xl font-sans text-sm text-pearl-faint"
            style={{ background: "rgba(22,22,46,0.6)", border: "1px solid rgba(82,82,128,0.2)" }}>
            Connect wallet to withdraw
          </div>
        ) : !isCorrectNetwork ? (
          <div className="py-3.5 text-center rounded-xl font-sans text-sm text-red"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
            ⚠ Wrong network
          </div>
        ) : (
          <button
            onClick={onWithdraw}
            disabled={isBusy || !hasProceeds || isSuccess}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-sans font-bold text-base transition-all duration-200"
            style={
              hasProceeds && !isBusy && !isSuccess
                ? { background: "linear-gradient(135deg,#22C55E,#16A34A)", boxShadow: "0 4px 20px rgba(34,197,94,0.3)", color: "white" }
                : { background: "rgba(22,22,46,0.6)", border: "1px solid rgba(82,82,128,0.2)", color: "#525280" }
            }
          >
            {isBusy
              ? <><Loader2 className="w-5 h-5 animate-spin" />{withdrawTx.status === "confirming" ? "Confirming…" : "Withdrawing…"}</>
              : isSuccess
              ? <><CheckCircle2 className="w-5 h-5" /> Withdrawn!</>
              : <><Banknote className="w-5 h-5" />{hasProceeds ? `Withdraw ${proceeds.amountEth} ETH` : "No proceeds available"}</>
            }
          </button>
        )}
      </div>
    </div>
  );
}
