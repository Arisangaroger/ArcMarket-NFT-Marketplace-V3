"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, Tag, ShieldCheck, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import type { NFTItem, TxState } from "@/types";

interface Props {
  nft: NFTItem;
  tx: TxState;
  explorerUrl: string | null;
  isBusy: boolean;
  onList: (tokenId: number, price: string) => void;
  onClose: () => void;
  onDismissTx: () => void;
}

export default function ListModal({ nft, tx, explorerUrl, isBusy, onList, onClose, onDismissTx }: Props) {
  const [price, setPrice] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape" && !isBusy) onClose(); };
    window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn);
  }, [onClose, isBusy]);

  const submit = () => {
    if (!price || isNaN(Number(price)) || Number(price) <= 0) { setErr("Enter a valid price > 0"); return; }
    setErr(""); onList(nft.tokenId, price);
  };

  const isSuccess = tx.status === "success" && tx.action === "list";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in" style={{ background: "rgba(8,8,14,0.8)", backdropFilter: "blur(8px)" }} onClick={!isBusy ? onClose : undefined} />
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden animate-slide-up shadow-modal"
        style={{ background: "linear-gradient(160deg,rgba(22,22,46,0.98),rgba(13,13,24,0.99))", border: "1px solid rgba(124,58,237,0.25)" }}>
        <div className="h-[2px]" style={{ background: "linear-gradient(90deg,transparent,#7C3AED,#06B6D4,transparent)" }} />
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(124,58,237,0.1)" }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.2)" }}>
              <Tag className="w-4 h-4 text-violet-light" />
            </div>
            <div>
              <h2 className="font-display text-lg text-pearl">List for Sale</h2>
              <p className="font-mono text-xs text-pearl-faint">Token #{nft.tokenId}</p>
            </div>
          </div>
          <button onClick={!isBusy ? onClose : undefined} className="p-2 rounded-xl text-pearl-faint hover:text-pearl transition-colors" style={{ background: "rgba(22,22,46,0.6)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-4 p-3 rounded-2xl" style={{ background: "rgba(22,22,46,0.6)", border: "1px solid rgba(124,58,237,0.1)" }}>
            <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "rgba(30,30,63,0.8)" }}>
              {nft.imageUrl ? <Image src={nft.imageUrl} alt={nft.metadata?.name ?? `#${nft.tokenId}`} fill className="object-cover" sizes="56px" /> : <div className="w-full h-full flex items-center justify-center font-display text-2xl text-pearl-faint">{nft.tokenId}</div>}
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-pearl">{nft.metadata?.name ?? `NFT #${nft.tokenId}`}</p>
              <p className="font-mono text-xs text-pearl-faint mt-0.5">Owned by you</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
            <ShieldCheck className="w-4 h-4 text-amber flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-sans text-xs text-amber font-semibold">Approval may be required</p>
              <p className="font-sans text-xs text-pearl-faint mt-0.5">If not yet approved, you&apos;ll sign one approval tx first — granting the marketplace permission to transfer your NFT.</p>
            </div>
          </div>

          {!isSuccess && (
            <div>
              <label className="block font-mono text-xs text-pearl-faint uppercase tracking-widest mb-2">Sale Price (ETH)</label>
              <div className="relative">
                <input type="number" min="0" step="0.001" value={price} onChange={e => { setPrice(e.target.value); setErr(""); }}
                  placeholder="0.00" disabled={isBusy}
                  className="w-full px-4 py-3 pr-14 rounded-xl font-mono text-sm text-pearl placeholder:text-pearl-faint focus:outline-none disabled:opacity-50 transition-all"
                  style={{ background: "rgba(13,13,24,0.9)", border: err ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(124,58,237,0.3)", boxShadow: err ? "0 0 0 2px rgba(239,68,68,0.1)" : "0 0 0 2px rgba(124,58,237,0.08)" }} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-pearl-faint">ETH</span>
              </div>
              {err && <div className="flex items-center gap-1.5 mt-1.5"><AlertCircle className="w-3.5 h-3.5 text-red" /><p className="font-sans text-xs text-red">{err}</p></div>}
            </div>
          )}

          {/* Inline tx status */}
          {tx.status !== "idle" && !isSuccess && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(22,22,46,0.6)", border: "1px solid rgba(124,58,237,0.15)" }}>
              <Loader2 className="w-4 h-4 text-violet-light animate-spin" />
              <p className="font-sans text-sm text-pearl">{tx.status === "approving" ? "Approving marketplace…" : tx.status === "pending" ? "Waiting for wallet…" : "Confirming on-chain…"}</p>
            </div>
          )}
          {tx.status === "error" && <p className="font-sans text-xs text-red px-1">{tx.error}</p>}

          {isSuccess && (
            <div className="p-4 rounded-2xl text-center" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
              <CheckCircle2 className="w-7 h-7 text-violet-light mx-auto mb-2 animate-bounce-in" />
              <p className="font-display text-base text-violet-glow">NFT Listed Successfully!</p>
            </div>
          )}

          {!isSuccess ? (
            <div className="flex gap-3">
              <button onClick={!isBusy ? onClose : undefined} disabled={isBusy}
                className="flex-1 py-3.5 rounded-xl font-sans text-sm font-semibold text-pearl-dim hover:text-pearl transition-colors disabled:opacity-40"
                style={{ background: "rgba(22,22,46,0.6)", border: "1px solid rgba(82,82,128,0.3)" }}>Cancel</button>
              <button onClick={submit} disabled={isBusy || !price}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-sans font-bold text-sm text-white disabled:opacity-50 transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#7C3AED,#06B6D4)", boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }}>
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Tag className="w-4 h-4" />List NFT <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          ) : (
            <button onClick={onClose} className="w-full py-3.5 rounded-xl font-sans font-bold text-sm text-white" style={{ background: "linear-gradient(135deg,#7C3AED,#06B6D4)" }}>Done ✓</button>
          )}
        </div>
      </div>
    </div>
  );
}
