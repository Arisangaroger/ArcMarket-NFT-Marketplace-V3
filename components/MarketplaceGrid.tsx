"use client";
import React, { useMemo } from "react";
import { Search, SlidersHorizontal, X, ChevronDown, PackageSearch } from "lucide-react";
import { ethers } from "ethers";
import NFTCard from "./NFTCard";
import { NFTCardSkeleton } from "./Loader";
import type { NFTItem, MarketFilters } from "@/types";

interface Props {
  nfts: NFTItem[];
  isLoading: boolean;
  connectedAddress: string | null;
  feePercent: number;
  filters: MarketFilters;
  onFilterChange: (f: Partial<MarketFilters>) => void;
  onFilterReset: () => void;
  onBuy: (nft: NFTItem) => void;
  onList: (nft: NFTItem) => void;
  onCancel: (nft: NFTItem) => void;
  isBusy: boolean;
  maxSupply: number;
}

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "listed", label: "Listed" },
  { key: "unlisted", label: "Unlisted" },
] as const;

const SORT_OPTIONS = [
  { value: "id_asc",    label: "ID ↑" },
  { value: "id_desc",   label: "ID ↓" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc",label: "Price ↓" },
] as const;

export default function MarketplaceGrid({ nfts, isLoading, connectedAddress, feePercent, filters, onFilterChange, onFilterReset, onBuy, onList, onCancel, isBusy, maxSupply }: Props) {
  const filtered = useMemo(() => {
    let list = [...nfts];
    if (filters.status === "listed")   list = list.filter(n => n.listing?.isActive);
    if (filters.status === "unlisted") list = list.filter(n => !n.listing?.isActive);
    if (filters.minPrice) {
      const min = parseFloat(filters.minPrice);
      list = list.filter(n => !n.listing || parseFloat(ethers.formatEther(n.listing.price)) >= min);
    }
    if (filters.maxPrice) {
      const max = parseFloat(filters.maxPrice);
      list = list.filter(n => !n.listing || parseFloat(ethers.formatEther(n.listing.price)) <= max);
    }
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(n => n.tokenId.toString().includes(q) || n.metadata?.name?.toLowerCase().includes(q) || n.owner?.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (filters.sortBy) {
        case "id_asc":    return a.tokenId - b.tokenId;
        case "id_desc":   return b.tokenId - a.tokenId;
        case "price_asc": return (a.listing?Number(a.listing.price):Infinity)-(b.listing?Number(b.listing.price):Infinity);
        case "price_desc":return (b.listing?Number(b.listing.price):-Infinity)-(a.listing?Number(a.listing.price):-Infinity);
        default: return 0;
      }
    });
    return list;
  }, [nfts, filters]);

  const hasActive = filters.status !== "all" || filters.search !== "" || filters.minPrice !== "" || filters.maxPrice !== "";

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="p-4 rounded-2xl space-y-3" style={{ background: "rgba(22,22,46,0.5)", border: "1px solid rgba(124,58,237,0.1)", backdropFilter: "blur(8px)" }}>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pearl-faint" />
            <input type="text" value={filters.search} onChange={e => onFilterChange({ search: e.target.value })}
              placeholder="Search by name or token ID…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl font-sans text-sm text-pearl placeholder:text-pearl-faint focus:outline-none transition-all"
              style={{ background: "rgba(13,13,24,0.8)", border: "1px solid rgba(124,58,237,0.2)" }}
              onFocus={e => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
              onBlur={e => (e.target.style.borderColor = "rgba(124,58,237,0.2)")} />
            {filters.search && (
              <button onClick={() => onFilterChange({ search: "" })} className="absolute right-3 top-1/2 -translate-y-1/2 text-pearl-faint hover:text-pearl">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {/* Sort */}
          <div className="relative w-full sm:w-40">
            <select value={filters.sortBy} onChange={e => onFilterChange({ sortBy: e.target.value as MarketFilters["sortBy"] })}
              className="w-full appearance-none pl-4 pr-8 py-2.5 rounded-xl font-sans text-sm text-pearl focus:outline-none cursor-pointer"
              style={{ background: "rgba(13,13,24,0.8)", border: "1px solid rgba(124,58,237,0.2)" }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-pearl-faint pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(13,13,24,0.6)" }}>
            {STATUS_TABS.map(({ key, label }) => (
              <button key={key} onClick={() => onFilterChange({ status: key })}
                className="px-3.5 py-1.5 rounded-lg font-sans text-xs font-medium transition-all"
                style={filters.status === key
                  ? { background: "linear-gradient(135deg,rgba(124,58,237,0.4),rgba(6,182,212,0.2))", color: "#F4F4FF", border: "1px solid rgba(124,58,237,0.3)" }
                  : { color: "#525280" }}>
                {label}
              </button>
            ))}
          </div>

          {/* Price range */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-pearl-faint" />
            <input type="number" min="0" step="0.001" value={filters.minPrice} onChange={e => onFilterChange({ minPrice: e.target.value })}
              placeholder="Min" className="w-20 px-2.5 py-1.5 rounded-lg font-mono text-xs text-pearl placeholder:text-pearl-faint focus:outline-none"
              style={{ background: "rgba(13,13,24,0.8)", border: "1px solid rgba(124,58,237,0.2)" }} />
            <span className="text-pearl-faint text-xs">—</span>
            <input type="number" min="0" step="0.001" value={filters.maxPrice} onChange={e => onFilterChange({ maxPrice: e.target.value })}
              placeholder="Max" className="w-20 px-2.5 py-1.5 rounded-lg font-mono text-xs text-pearl placeholder:text-pearl-faint focus:outline-none"
              style={{ background: "rgba(13,13,24,0.8)", border: "1px solid rgba(124,58,237,0.2)" }} />
            <span className="font-mono text-xs text-pearl-faint">ETH</span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <span className="font-mono text-xs text-pearl-faint">{isLoading ? "…" : `${filtered.length}/${nfts.length}`}</span>
            {hasActive && (
              <button onClick={onFilterReset} className="flex items-center gap-1 font-sans text-xs text-red hover:underline">
                <X className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading && nfts.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: maxSupply }).map((_, i) => <NFTCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center rounded-2xl"
          style={{ background: "rgba(22,22,46,0.4)", border: "1px solid rgba(124,58,237,0.1)" }}>
          <PackageSearch className="w-12 h-12 text-pearl-faint mb-4" />
          <p className="font-display text-xl text-pearl mb-1">No NFTs found</p>
          <p className="font-sans text-sm text-pearl-faint mb-4">Try adjusting your filters</p>
          <button onClick={onFilterReset} className="px-5 py-2.5 rounded-xl font-sans text-sm font-semibold text-violet-light transition-all hover:opacity-80"
            style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((nft, i) => (
            <NFTCard key={nft.tokenId} nft={nft} connectedAddress={connectedAddress} feePercent={feePercent}
              onBuy={onBuy} onList={onList} onCancel={onCancel} isBusy={isBusy}
              style={{ animationDelay: `${i * 40}ms`, animation: "fadeUp 0.5s ease-out both" }} />
          ))}
        </div>
      )}
    </div>
  );
}
