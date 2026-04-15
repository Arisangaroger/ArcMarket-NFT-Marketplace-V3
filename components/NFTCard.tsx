"use client";
import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Eye, Tag, X, ImageOff, Percent } from "lucide-react";
import type { NFTItem } from "@/types";
import { truncateAddr } from "@/lib/utils";

import { Skeleton } from "./Loader";

interface Props {
  nft: NFTItem;
  connectedAddress: string | null;
  feePercent: number;
  onBuy: (nft: NFTItem) => void;
  onList: (nft: NFTItem) => void;
  onCancel: (nft: NFTItem) => void;
  isBusy?: boolean;
  style?: React.CSSProperties;
  
}

export default function NFTCard({ nft, connectedAddress, feePercent, onBuy, onList, onCancel, isBusy = false, style }: Props) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const rippleId = useRef(0);

  const addr   = connectedAddress?.toLowerCase();
  const owner  = nft.owner?.toLowerCase();
  const seller = nft.listing?.seller?.toLowerCase();
  const isOwner  = !!addr && addr === owner;
  const isSeller = !!addr && addr === seller;
  const isListed = !!nft.listing?.isActive;
  const canBuy    = isListed && !!addr && !isOwner && !isSeller;
  const canList   = isOwner && !isListed;
  const canCancel = isSeller && isListed;

  const addRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = ++rippleId.current;
    setRipples(r => [...r, { x, y, id }]);
    setTimeout(() => setRipples(r => r.filter(r => r.id !== id)), 600);
  };

  return (
    <div
      style={{
        ...style,
        background: "linear-gradient(135deg, rgba(22,22,46,0.9) 0%, rgba(13,13,24,0.95) 100%)",
        border: hovered ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(124,58,237,0.12)",
        boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.3)" : "0 2px 8px rgba(0,0,0,0.4)",
        transform: hovered ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
        transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
      }}
      className="relative rounded-2xl overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image container */}
      <div className="relative aspect-square overflow-hidden">
        {nft.isLoadingMeta ? (
          <Skeleton className="absolute inset-0" />
        ) : nft.imageUrl && !imgError ? (
          <>
            {!imgLoaded && <Skeleton className="absolute inset-0" />}
            <Image
              src={nft.imageUrl}
              alt={nft.metadata?.name ?? `#${nft.tokenId}`}
              fill
              className="object-cover transition-all duration-700"
              style={{ transform: hovered ? "scale(1.06)" : "scale(1)" }}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(22,22,46,0.6)" }}>
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: "radial-gradient(circle at 30% 40%, rgba(124,58,237,0.4) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(6,182,212,0.3) 0%, transparent 50%)",
              }}
            />
            {imgError
              ? <ImageOff className="w-10 h-10 text-pearl-faint relative z-10" />
              : <span className="font-display text-5xl text-pearl-faint relative z-10">{nft.tokenId}</span>}
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          {isListed ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-sans text-[11px] font-semibold"
              style={{ background: "rgba(124,58,237,0.25)", border: "1px solid rgba(124,58,237,0.4)", backdropFilter: "blur(8px)", color: "#C084FC" }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute h-full w-full rounded-full bg-violet-light opacity-75" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-violet-light" />
              </span>
              Listed
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full font-sans text-[11px]"
              style={{ background: "rgba(8,8,14,0.7)", border: "1px solid rgba(82,82,128,0.3)", backdropFilter: "blur(8px)", color: "#525280" }}>
              Unlisted
            </span>
          )}
        </div>

        {/* Yours badge */}
        {isOwner && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="px-2.5 py-1 rounded-full font-sans text-[11px] font-semibold"
              style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", backdropFilter: "blur(8px)", color: "#F59E0B" }}>
              Yours
            </span>
          </div>
        )}

        {/* Fee badge */}
        {isListed && (
          <div className="absolute bottom-2.5 right-2.5 z-10">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[9px]"
              style={{ background: "rgba(8,8,14,0.8)", border: "1px solid rgba(82,82,128,0.3)", backdropFilter: "blur(8px)", color: "#525280" }}>
              <Percent className="w-2 h-2" />
              {feePercent / 100}% fee
            </span>
          </div>
        )}

        {/* Hover overlay: Quick Buy + View Details */}
        <div
          className="absolute inset-0 flex items-center justify-center gap-3 transition-opacity duration-200"
          style={{
            background: "linear-gradient(to top, rgba(8,8,14,0.85) 0%, rgba(8,8,14,0.4) 100%)",
            opacity: hovered ? 1 : 0,
            backdropFilter: hovered ? "blur(2px)" : "none",
          }}
        >
          {canBuy && (
            <button
              onClick={(e) => { addRipple(e); onBuy(nft); }}
              disabled={isBusy}
              className="relative overflow-hidden flex items-center gap-1.5 px-4 py-2 rounded-xl font-sans font-bold text-sm text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#7C3AED,#06B6D4)", boxShadow: "0 4px 16px rgba(124,58,237,0.4)" }}
            >
              {ripples.map(r => (
                <span key={r.id} className="absolute rounded-full bg-white/30 w-8 h-8 animate-ripple pointer-events-none"
                  style={{ left: r.x - 16, top: r.y - 16 }} />
              ))}
              <ShoppingBag className="w-3.5 h-3.5" /> Buy
            </button>
          )}
          <Link href={`/nft/${nft.tokenId}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-sans font-semibold text-sm text-pearl transition-transform hover:scale-105"
            style={{ background: "rgba(22,22,46,0.9)", border: "1px solid rgba(124,58,237,0.3)", backdropFilter: "blur(4px)" }}
            onClick={e => e.stopPropagation()}>
            <Eye className="w-3.5 h-3.5" /> View
          </Link>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          {nft.isLoadingMeta
            ? <Skeleton className="h-4 w-3/4" />
            : <p className="font-display text-sm font-semibold text-pearl truncate">{nft.metadata?.name ?? `NFT #${nft.tokenId}`}</p>
          }
          <span className="flex-shrink-0 font-mono text-[11px] text-pearl-faint mt-0.5">#{nft.tokenId}</span>
        </div>

        {nft.isLoadingMeta
          ? <Skeleton className="h-3 w-1/2 mb-3" />
          : <p className="font-mono text-[11px] text-pearl-faint mb-3 truncate">
              {isOwner ? "You" : nft.owner ? truncateAddr(nft.owner) : "—"}
            </p>
        }

        {isListed && nft.listing && (
          <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-xl"
            style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)" }}>
            <span className="font-sans text-xs text-pearl-dim">Price</span>
            <span className="font-display text-base font-semibold text-violet-glow">{nft.listing.priceEth} ETH</span>
          </div>
        )}

        {nft.isLoadingMeta ? <Skeleton className="h-9 w-full rounded-xl" /> : (
          <div>
            {canBuy && (
              <button onClick={() => onBuy(nft)} disabled={isBusy}
                className="w-full py-2.5 rounded-xl font-sans font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#7C3AED,#9333EA)", boxShadow: "0 4px 16px rgba(124,58,237,0.25)" }}>
                Buy · {nft.listing!.priceEth} ETH
              </button>
            )}
            {canList && (
              <button onClick={() => onList(nft)} disabled={isBusy}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-sans font-semibold text-sm text-pearl-dim transition-all hover:text-pearl"
                style={{ background: "rgba(22,22,46,0.6)", border: "1px solid rgba(124,58,237,0.2)" }}>
                <Tag className="w-3.5 h-3.5" /> List for Sale
              </button>
            )}
            {canCancel && (
              <button onClick={() => onCancel(nft)} disabled={isBusy}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-sans font-semibold text-sm text-red transition-all hover:bg-red/10"
                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <X className="w-3.5 h-3.5" /> Cancel Listing
              </button>
            )}
            {!canBuy && !canList && !canCancel && (
              <div className="w-full py-2.5 text-center font-sans text-xs text-pearl-faint rounded-xl"
                style={{ background: "rgba(22,22,46,0.4)", border: "1px solid rgba(82,82,128,0.15)" }}>
                {!addr ? "Connect wallet" : "Not for sale"}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
