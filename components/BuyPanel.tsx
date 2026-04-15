"use client";
import React, { useEffect } from "react";
import Image from "next/image";
import { X, ShoppingBag, AlertTriangle, ExternalLink, CheckCircle2, Loader2, Clock, Info } from "lucide-react";
import type { NFTItem, TxState } from "@/types";
import { calcFeeBreakdown, truncateAddr, txUrl } from "@/lib/utils";

interface Props {
  nft: NFTItem;
  tx: TxState;
  explorerUrl: string | null;
  gasPreview: string | null;
  isBusy: boolean;
  feePercent: number;
  onBuy: () => void;
  onClose: () => void;
  onDismissTx: () => void;
  chainId: number | null;
}

export default function BuyPanel({ nft, tx, explorerUrl, gasPreview, isBusy, feePercent, onBuy, onClose, onDismissTx, chainId }: Props) {
  const listing = nft.listing!;
  const breakdown = calcFeeBreakdown(listing.price, feePercent);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape" && !isBusy) onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose, isBusy]);

  const isSuccess = tx.status === "success" && tx.action === "buy";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in" style={{ background: "rgba(8,8,14,0.8)", backdropFilter: "blur(8px)" }} onClick={!isBusy ? onClose : undefined} />

      <div className="relative w-full max-w-md rounded-3xl overflow-hidden animate-slide-up shadow-modal"
        style={{ background: "linear-gradient(160deg,rgba(22,22,46,0.98) 0%,rgba(13,13,24,0.99) 100%)", border: "1px solid rgba(124,58,237,0.25)" }}>
        {/* Gradient top border */}
        <div className="h-[2px]" style={{ background: "linear-gradient(90deg,transparent,#7C3AED,#06B6D4,transparent)" }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.2)" }}>
              <ShoppingBag className="w-4 h-4 text-violet-light" />
            </div>
            <div>
              <h2 className="font-display text-lg text-pearl">Confirm Purchase</h2>
              <p className="font-mono text-xs text-pearl-faint">Token #{nft.tokenId}</p>
            </div>
          </div>
          <button onClick={!isBusy ? onClose : undefined}
            className="p-2 rounded-xl text-pearl-faint hover:text-pearl transition-colors disabled:pointer-events-none"
            style={{ background: "rgba(22,22,46,0.6)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* NFT Preview */}
          <div className="flex items-center gap-4 p-3 rounded-2xl"
            style={{ background: "rgba(22,22,46,0.6)", border: "1px solid rgba(124,58,237,0.1)" }}>
            <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0"
              style={{ background: "rgba(30,30,63,0.8)", border: "1px solid rgba(124,58,237,0.15)" }}>
              {nft.imageUrl ? (
                <Image src={nft.imageUrl} alt={nft.metadata?.name ?? `#${nft.tokenId}`} fill className="object-cover" sizes="56px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-display text-2xl text-pearl-faint">{nft.tokenId}</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-semibold text-pearl truncate">{nft.metadata?.name ?? `NFT #${nft.tokenId}`}</p>
              <p className="font-mono text-xs text-pearl-faint mt-0.5">Seller: {truncateAddr(listing.seller)}</p>
            </div>
          </div>

          {/* 🔥 Full fee breakdown — transparency */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(124,58,237,0.15)" }}>
            <div className="px-4 py-3" style={{ background: "rgba(22,22,46,0.5)", borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
              <p className="font-mono text-[10px] text-pearl-faint uppercase tracking-widest mb-3">Cost Breakdown</p>
              {[
                { label: "NFT Price", value: `${breakdown.priceEth} ETH`, color: "text-pearl" },
                { label: `Platform Fee (${breakdown.feePercent}%)`, value: `${breakdown.feeEth} ETH`, color: "text-pearl-dim" },
                { label: "Seller Receives", value: `${breakdown.sellerReceivesEth} ETH`, color: "text-cyan" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-1.5">
                  <span className="font-sans text-xs text-pearl-dim">{label}</span>
                  <span className={`font-mono text-sm font-semibold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between px-4 py-3"
              style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.12),rgba(6,182,212,0.06))" }}>
              <div className="flex items-center gap-2">
                <span className="font-sans text-sm font-bold text-pearl">You Pay</span>
                <span className="font-sans text-xs text-pearl-faint">(price already includes fee)</span>
              </div>
              <span className="font-display text-xl font-bold text-violet-glow">{breakdown.priceEth} ETH</span>
            </div>
          </div>

          {/* Gas estimate */}
          {gasPreview && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)" }}>
              <Info className="w-3.5 h-3.5 text-cyan flex-shrink-0" />
              <p className="font-mono text-xs text-cyan">+ ~{gasPreview} ETH estimated gas</p>
            </div>
          )}

          {/* Safety warning */}
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
            style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
            <AlertTriangle className="w-4 h-4 text-amber flex-shrink-0 mt-0.5" />
            <p className="font-sans text-xs text-pearl-dim leading-relaxed">
              You&apos;re about to spend <span className="text-amber font-semibold">{breakdown.priceEth} ETH</span>. This action is irreversible.
            </p>
          </div>

          {/* Tx status inline */}
          {tx.status !== "idle" && tx.status !== "success" && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: "rgba(22,22,46,0.6)", border: "1px solid rgba(124,58,237,0.15)" }}>
              {tx.status === "approving" || tx.status === "pending" || tx.status === "confirming"
                ? <Loader2 className="w-4 h-4 text-violet-light animate-spin" />
                : <X className="w-4 h-4 text-red" />
              }
              <div>
                <p className="font-sans text-sm font-semibold text-pearl">
                  {tx.status === "approving" ? "Approving…" : tx.status === "pending" ? "Waiting for wallet…" : tx.status === "confirming" ? "Confirming on-chain…" : "Transaction failed"}
                </p>
                {tx.error && <p className="font-sans text-xs text-red mt-0.5">{tx.error}</p>}
                {tx.hash && explorerUrl && (
                  <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-violet-light hover:underline mt-0.5">
                    View tx <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Success */}
          {isSuccess && (
            <div className="p-4 rounded-xl text-center"
              style={{ background: "linear-gradient(135deg,rgba(34,197,94,0.1),rgba(6,182,212,0.06))", border: "1px solid rgba(34,197,94,0.2)" }}>
              <CheckCircle2 className="w-8 h-8 text-green mx-auto mb-2 animate-bounce-in" />
              <p className="font-display text-base text-green font-semibold">NFT Purchased! 🎉</p>
              <p className="font-sans text-xs text-pearl-dim mt-1">Check your profile to see it.</p>
              {explorerUrl && (
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-violet-light hover:underline mt-2">
                  View transaction <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Actions */}
          {!isSuccess ? (
            <div className="flex gap-3 pt-1">
              <button onClick={!isBusy ? onClose : undefined} disabled={isBusy}
                className="flex-1 py-3.5 rounded-xl font-sans text-sm font-semibold text-pearl-dim hover:text-pearl transition-colors disabled:opacity-40"
                style={{ background: "rgba(22,22,46,0.6)", border: "1px solid rgba(82,82,128,0.3)" }}>
                Cancel
              </button>
              <button onClick={onBuy} disabled={isBusy}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-sans font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#7C3AED,#06B6D4)", boxShadow: "0 4px 20px rgba(124,58,237,0.4)" }}>
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                {isBusy ? (tx.status === "confirming" ? "Confirming…" : "Buying…") : `Buy for ${breakdown.priceEth} ETH`}
              </button>
            </div>
          ) : (
            <button onClick={() => { onDismissTx(); onClose(); }}
              className="w-full py-3.5 rounded-xl font-sans font-bold text-sm text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#22C55E,#16A34A)" }}>
              Done ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
