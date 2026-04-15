"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { TrendingUp, Layers, DollarSign, Zap, Activity } from "lucide-react";
import Sidebar, { MobileTopbar } from "@/components/Sidebar";
import MarketplaceGrid from "@/components/MarketplaceGrid";
import BuyPanel from "@/components/BuyPanel";
import ListModal from "@/components/ListModal";
import NotificationBell from "@/components/NotificationBell";
import { Skeleton } from "@/components/Loader";
import { useWallet } from "@/hooks/useWallet";
import { useNFTs } from "@/hooks/useNFTs";
import { useMarketplace } from "@/hooks/useMarketplace";
import { useEvents } from "@/hooks/useEvents";
import { useProceeds } from "@/hooks/useProceeds";
import { useAdmin } from "@/hooks/useAdmin";
import { notificationStore } from "@/lib/notifications";
import type { NFTItem, MarketFilters, ActivityEvent } from "@/types";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import { truncateAddr, timeAgo, txUrl } from "@/lib/utils";
import { ethers } from "ethers";

const DEFAULT_FILTERS: MarketFilters = { status:"all",minPrice:"",maxPrice:"",search:"",sortBy:"id_asc" };

export default function MarketplacePage() {
  const { wallet,provider,signer,connect,disconnect,switchNetwork,isCorrectNetwork,chainName,targetChainName } = useWallet();
  const { nfts,setNfts,isLoading:nftsLoading,fetchNFTs,isApproved,approveMarketplace } = useNFTs();
  const { tx,explorerUrl,gasPreview,isBusy,reset,feePercent,fetchPlatformFee,fetchAllListings,estimateBuyGas,listItem,buyItem,cancelListing } = useMarketplace(signer,wallet.chainId);
  const { events,setEvents,isLoading:eventsLoading,fetchEvents,subscribeEvents } = useEvents();
  const { proceeds,fetchProceeds,hasProceeds } = useProceeds(signer,wallet.chainId);
  const { isOwner,checkOwner } = useAdmin(signer,wallet.chainId);

  const [filters,setFilters]     = useState<MarketFilters>(DEFAULT_FILTERS);
  const [listTarget,setListTarget] = useState<NFTItem|null>(null);
  const [buyTarget,setBuyTarget]   = useState<NFTItem|null>(null);
  const unsubRef = useRef<(()=>void)|null>(null);

  // Merge listings into NFTs
  const mergeListings = useCallback(async(p:typeof provider)=>{
    if (!p) return;
    const map = await fetchAllListings(p);
    setNfts(prev=>prev.map(n=>({...n,listing:map.get(n.tokenId)??null})));
  },[fetchAllListings,setNfts]);

  // Initial load
  useEffect(()=>{
    if (!provider) return;
    fetchNFTs(provider);
    mergeListings(provider);
    fetchEvents(provider);
    fetchPlatformFee(provider);
    if (wallet.address){fetchProceeds(provider,wallet.address);checkOwner(provider,wallet.address);}
  },[provider,wallet.address,fetchNFTs,mergeListings,fetchEvents,fetchPlatformFee,fetchProceeds,checkOwner]);

  // Real-time event subscriptions
  useEffect(()=>{
    if (!provider) return;
    if (unsubRef.current) unsubRef.current();
    const unsub = subscribeEvents(provider,(e:ActivityEvent)=>{
      setEvents(prev=>[e,...prev]);
      if (e.type==="sold") {
        const isMine = e.seller?.toLowerCase()===wallet.address?.toLowerCase();
        notificationStore.push("sale", isMine?"Your NFT Sold! 🎉":"NFT Sold", isMine?`NFT #${e.tokenId} sold for ${e.priceEth} ETH. You earned ~${e.priceEth} ETH`:`NFT #${e.tokenId} was purchased for ${e.priceEth} ETH`,e.txHash);
        if (isMine) toast.success(`Your NFT #${e.tokenId} sold for ${e.priceEth} ETH! 🎉`,{duration:7000});
      }
      if (e.type==="listed") notificationStore.push("listing","NFT Listed",`NFT #${e.tokenId} listed for ${e.priceEth} ETH`);
      if (e.type==="cancelled") notificationStore.push("cancel","Listing Cancelled",`NFT #${e.tokenId} listing was removed`);
      if (e.type==="updated") notificationStore.push("update","Price Updated",`NFT #${e.tokenId} price changed to ${e.priceEth} ETH`);
      if (provider) mergeListings(provider);
    });
    unsubRef.current=unsub;
    return ()=>{if(unsubRef.current)unsubRef.current();};
  },[provider,wallet.address,subscribeEvents,setEvents,mergeListings]);

  // Wallet error
  useEffect(()=>{if(wallet.error)toast.error(wallet.error);},[wallet.error]);

  // Tx notifications
  useEffect(()=>{
    if (tx.status==="success"){
      const msgs:Record<string,string>={list:"NFT listed!",buy:"NFT purchased! 🎉",cancel:"Listing cancelled."};
      if (tx.action){toast.success(msgs[tx.action]??"Done!");notificationStore.push(tx.action==="buy"?"sale":"listing",msgs[tx.action]??"",(tx.hash??""),tx.hash??undefined);}
      if (provider){mergeListings(provider);if(wallet.address)fetchProceeds(provider,wallet.address);}
    }
    if (tx.status==="error"&&tx.error) toast.error(tx.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[tx.status]);

  const handleOpenBuy = useCallback(async(nft:NFTItem)=>{
    setBuyTarget(nft);reset();
    if (nft.listing) await estimateBuyGas(nft.tokenId,nft.listing.price);
  },[reset,estimateBuyGas]);

  const handleBuy = useCallback(async()=>{
    if (!buyTarget?.listing) return;
    await buyItem(buyTarget.tokenId,buyTarget.listing.price);
  },[buyTarget,buyItem]);

  const handleList = useCallback(async(tokenId:number,price:string)=>{
    const ok = await listItem(tokenId,price,isApproved,approveMarketplace);
    if (ok) notificationStore.push("listing","NFT Listed",`NFT #${tokenId} listed for ${price} ETH`);
  },[listItem,isApproved,approveMarketplace]);

  const handleCancel = useCallback(async(nft:NFTItem)=>{
    const ok=await cancelListing(nft.tokenId);
    if (ok&&provider){mergeListings(provider);notificationStore.push("cancel","Listing Cancelled",`NFT #${nft.tokenId} listing removed`);}
  },[cancelListing,provider,mergeListings]);

  // Hero stats
  const listed   = nfts.filter(n=>n.listing?.isActive).length;
  const floorWei = nfts.filter(n=>n.listing?.isActive).map(n=>n.listing!.price).sort((a,b)=>Number(a)-Number(b))[0];
  const floorEth = floorWei?parseFloat(ethers.formatEther(floorWei)).toFixed(3):"—";
  const volumeEth = events.filter(e=>e.type==="sold").reduce((s,e)=>s+parseFloat(e.priceEth??"0"),0).toFixed(3);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar wallet={wallet} isCorrectNetwork={isCorrectNetwork} targetChainName={targetChainName} isOwner={isOwner}
        hasProceeds={hasProceeds} proceedsEth={proceeds.amountEth} unreadCount={0}
        onConnect={connect} onDisconnect={disconnect} onSwitchNetwork={switchNetwork} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <MobileTopbar wallet={wallet} onConnect={connect} onDisconnect={disconnect} unreadCount={0} hasProceeds={hasProceeds} />

        <main className="flex-1 p-6 md:p-8 space-y-8">
          {/* Top bar: title + notification bell */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-pearl font-semibold">
                Marketplace
              </h1>
              <p className="font-sans text-sm text-pearl-faint mt-1">Browse, buy, and list NFTs on-chain</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <NotificationBell chainId={wallet.chainId} />
            </div>
          </div>

          {/* Hero stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon:<Layers className="w-4 h-4"/>,    label:"Total NFTs",    value:nftsLoading?null:nfts.length.toString(),     color:"text-pearl",    grad:"from-violet-pale to-transparent", border:"rgba(124,58,237,0.2)" },
              { icon:<TrendingUp className="w-4 h-4"/>, label:"Listed",        value:nftsLoading?null:listed.toString(),           color:"text-violet-glow",grad:"from-violet-pale to-transparent",border:"rgba(124,58,237,0.2)" },
              { icon:<DollarSign className="w-4 h-4"/>, label:"Floor Price",   value:nftsLoading?null:`${floorEth} ETH`,           color:"text-cyan",     grad:"from-cyan-pale to-transparent",   border:"rgba(6,182,212,0.2)" },
              { icon:<Activity className="w-4 h-4"/>,   label:"Volume Traded", value:eventsLoading?null:`${volumeEth} ETH`,        color:"text-green",    grad:"from-green-pale to-transparent",  border:"rgba(34,197,94,0.2)" },
            ].map(({icon,label,value,color,grad,border})=>(
              <div key={label} className="relative rounded-2xl p-5 overflow-hidden group hover:scale-[1.02] transition-transform"
                style={{ background:"linear-gradient(135deg,rgba(22,22,46,0.9),rgba(13,13,24,0.95))", border:`1px solid ${border}`, boxShadow:`0 4px 16px rgba(0,0,0,0.3)` }}>
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${grad} rounded-bl-3xl pointer-events-none opacity-50`} />
                <div className="flex items-center gap-2 mb-3" style={{color:border.replace("0.2","0.7")}}>
                  {icon}
                  <span className="font-mono text-[10px] text-pearl-faint uppercase tracking-widest">{label}</span>
                </div>
                {value===null
                  ? <Skeleton className="h-8 w-20"/>
                  : <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
                }
              </div>
            ))}
          </div>

          {/* Main content: grid + activity feed */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3">
              <MarketplaceGrid nfts={nfts} isLoading={nftsLoading} connectedAddress={wallet.address}
                feePercent={feePercent} filters={filters}
                onFilterChange={f=>setFilters(p=>({...p,...f}))}
                onFilterReset={()=>setFilters(DEFAULT_FILTERS)}
                onBuy={handleOpenBuy} onList={n=>{setListTarget(n);reset();}} onCancel={handleCancel}
                isBusy={isBusy} maxSupply={CONTRACT_ADDRESSES.maxSupply} />
            </div>

            {/* Activity feed */}
            <div className="xl:col-span-1">
              <div className="sticky top-6">
                <div className="rounded-2xl overflow-hidden"
                  style={{ background:"linear-gradient(135deg,rgba(22,22,46,0.9),rgba(13,13,24,0.95))", border:"1px solid rgba(124,58,237,0.12)" }}>
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom:"1px solid rgba(124,58,237,0.1)" }}>
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute h-full w-full rounded-full bg-violet opacity-60" />
                        <span className="relative h-2 w-2 rounded-full bg-violet" />
                      </span>
                      <span className="font-display text-sm text-pearl">Live Activity</span>
                    </div>
                    <span className="font-mono text-[10px] text-pearl-faint">{events.length} events</span>
                  </div>
                  <div className="divide-y" style={{ divideColor:"rgba(124,58,237,0.06)" }}>
                    {eventsLoading&&events.length===0
                      ? Array.from({length:5}).map((_,i)=>(
                          <div key={i} className="flex items-center gap-3 px-4 py-3">
                            <Skeleton className="w-7 h-7 rounded-lg flex-shrink-0" />
                            <div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-1/2"/><Skeleton className="h-3 w-3/4"/></div>
                          </div>
                        ))
                      : events.length===0
                        ? <div className="px-4 py-8 text-center"><Zap className="w-7 h-7 text-pearl-ghost mx-auto mb-2"/><p className="font-sans text-xs text-pearl-faint">No recent activity</p></div>
                        : events.slice(0,15).map((ev,i)=>{
                            const cfg:{bg:string;color:string;label:string}={
                              listed:  {bg:"rgba(124,58,237,0.1)",color:"text-violet-light",label:"Listed"},
                              sold:    {bg:"rgba(34,197,94,0.1)", color:"text-green",        label:"Sold"},
                              cancelled:{bg:"rgba(239,68,68,0.1)",color:"text-red",          label:"Cancelled"},
                              updated: {bg:"rgba(6,182,212,0.1)", color:"text-cyan",         label:"Updated"},
                            }[ev.type];
                            return (
                              <div key={ev.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                                style={{ animation:"fadeUp 0.3s ease-out both", animationDelay:`${i*25}ms`, borderBottom:"1px solid rgba(124,58,237,0.05)" }}>
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                  style={{ background:cfg.bg }}>
                                  <span className={`font-mono text-[9px] ${cfg.color}`}>{cfg.label.slice(0,1)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-[10px] font-bold" style={{ color:cfg.color.includes("violet")?var_or("#C084FC"):cfg.color.includes("green")?var_or("#22C55E"):cfg.color.includes("red")?var_or("#EF4444"):var_or("#06B6D4") }}>
                                      {cfg.label.toUpperCase()}
                                    </span>
                                    <a href={`/nft/${ev.tokenId}`} className="font-mono text-xs text-pearl hover:text-violet-light transition-colors">#{ev.tokenId}</a>
                                    {ev.priceEth && <span className="font-mono text-[10px] text-pearl-faint">{ev.priceEth}Ξ</span>}
                                  </div>
                                  <p className="font-mono text-[10px] text-pearl-faint truncate">
                                    {ev.type==="sold"?`buyer: ${truncateAddr(ev.buyer??"")}`:`seller: ${truncateAddr(ev.seller??"")}`}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="font-mono text-[10px] text-pearl-ghost">{ev.timestamp?timeAgo(ev.timestamp):`#${ev.blockNumber}`}</p>
                                  {wallet.chainId && (
                                    <a href={txUrl(ev.txHash,wallet.chainId)} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-violet-light hover:underline">tx</a>
                                  )}
                                </div>
                              </div>
                            );
                          })
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {listTarget && (
        <ListModal nft={listTarget} tx={tx} explorerUrl={explorerUrl} isBusy={isBusy}
          onList={handleList} onClose={()=>{setListTarget(null);reset();}} onDismissTx={reset} />
      )}
      {buyTarget && (
        <BuyPanel nft={buyTarget} tx={tx} explorerUrl={explorerUrl} gasPreview={gasPreview} isBusy={isBusy}
          feePercent={feePercent} chainId={wallet.chainId}
          onBuy={handleBuy} onClose={()=>{setBuyTarget(null);reset();}} onDismissTx={reset} />
      )}
    </div>
  );
}

function var_or(fallback:string):string { return fallback; }
