"use client";
import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { User, Tag, DollarSign, PackageOpen, ArrowRight, Wallet, X, Pencil } from "lucide-react";
import Sidebar, { MobileTopbar } from "@/components/Sidebar";
import WithdrawPanel from "@/components/WithdrawPanel";
import PriceEditor from "@/components/PriceEditor";
import ListModal from "@/components/ListModal";
import { Skeleton, NFTCardSkeleton, Spinner } from "@/components/Loader";
import NotificationBell from "@/components/NotificationBell";
import { useWallet } from "@/hooks/useWallet";
import { useNFTs } from "@/hooks/useNFTs";
import { useMarketplace } from "@/hooks/useMarketplace";
import { useProceeds } from "@/hooks/useProceeds";
import { useAdmin } from "@/hooks/useAdmin";
import { useEvents } from "@/hooks/useEvents";
import { notificationStore } from "@/lib/notifications";
import { truncateAddr } from "@/lib/utils";
import type { NFTItem } from "@/types";

type Tab = "nfts" | "listings" | "earnings";

export default function ProfilePage() {
  const { wallet,provider,signer,connect,disconnect,switchNetwork,isCorrectNetwork,chainName,targetChainName } = useWallet();
  const { nfts,setNfts,isLoading,fetchNFTs,isApproved,approveMarketplace } = useNFTs();
  const { tx,explorerUrl,isBusy,reset,feePercent,fetchPlatformFee,fetchAllListings,listItem,cancelListing,updateListing } = useMarketplace(signer,wallet.chainId);
  const { proceeds,fetchProceeds,withdrawProceeds,withdrawTx,explorerUrl:wUrl,resetTx:resetWTx,isBusy:wBusy,hasProceeds } = useProceeds(signer,wallet.chainId);
  const { isOwner:isContractOwner,checkOwner } = useAdmin(signer,wallet.chainId);
  const { events,fetchEvents } = useEvents();
  const [tab,setTab]           = useState<Tab>("nfts");
  const [listTarget,setListTarget] = useState<NFTItem|null>(null);

  const mergeListings = useCallback(async(p:typeof provider)=>{
    if (!p) return;
    const map=await fetchAllListings(p);
    setNfts(prev=>prev.map(n=>({...n,listing:map.get(n.tokenId)??null})));
  },[fetchAllListings,setNfts]);

  useEffect(()=>{
    if (!provider) return;
    fetchNFTs(provider);mergeListings(provider);fetchPlatformFee(provider);fetchEvents(provider);
    if (wallet.address){fetchProceeds(provider,wallet.address);checkOwner(provider,wallet.address);}
  },[provider,wallet.address,fetchNFTs,mergeListings,fetchPlatformFee,fetchEvents,fetchProceeds,checkOwner]);

  useEffect(()=>{
    if (tx.status==="success"){
      const msgs:Record<string,string>={list:"Listed!",cancel:"Cancelled.",update:"Price Updated!"};
      if (tx.action) toast.success(msgs[tx.action]??"Done!");
      if (provider) mergeListings(provider);
    }
    if (tx.status==="error"&&tx.error) toast.error(tx.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[tx.status]);

  useEffect(()=>{
    if (withdrawTx.status==="success") toast.success(`Proceeds withdrawn! 🎉`);
    if (withdrawTx.status==="error"&&withdrawTx.error) toast.error(withdrawTx.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[withdrawTx.status]);

  const addr = wallet.address?.toLowerCase();
  const myNFTs     = nfts.filter(n=>n.owner?.toLowerCase()===addr);
  const myListings = nfts.filter(n=>n.listing?.seller?.toLowerCase()===addr&&n.listing?.isActive);
  const mySales    = events.filter(e=>e.type==="sold"&&e.seller?.toLowerCase()===addr);

  const handleList = useCallback(async(tokenId:number,price:string)=>{
    const ok=await listItem(tokenId,price,isApproved,approveMarketplace);
    if (ok) notificationStore.push("listing","NFT Listed",`NFT #${tokenId} listed for ${price} ETH`);
  },[listItem,isApproved,approveMarketplace]);

  const handleCancel = useCallback(async(tokenId:number)=>{
    const ok=await cancelListing(tokenId);
    if (ok&&provider) mergeListings(provider);
  },[cancelListing,provider,mergeListings]);

  const handleUpdatePrice = useCallback(async(tokenId:number,newPrice:string):Promise<boolean>=>{
    const ok=await updateListing(tokenId,newPrice);
    if (ok&&provider) mergeListings(provider);
    return ok;
  },[updateListing,provider,mergeListings]);

  const TABS = [
    { key:"nfts" as Tab,      icon:<User className="w-4 h-4"/>,       label:"My NFTs",    count:myNFTs.length },
    { key:"listings" as Tab,  icon:<Tag className="w-4 h-4"/>,        label:"My Listings",count:myListings.length },
    { key:"earnings" as Tab,  icon:<DollarSign className="w-4 h-4"/>, label:"Earnings",   count:null },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar wallet={wallet} isCorrectNetwork={isCorrectNetwork} targetChainName={targetChainName} isOwner={isContractOwner}
        hasProceeds={hasProceeds} proceedsEth={proceeds.amountEth} unreadCount={0}
        onConnect={connect} onDisconnect={disconnect} onSwitchNetwork={switchNetwork} />

      <div className="flex-1 flex flex-col min-w-0">
        <MobileTopbar wallet={wallet} onConnect={connect} onDisconnect={disconnect} unreadCount={0} hasProceeds={hasProceeds} />

        <main className="flex-1 p-6 md:p-8 space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-pearl font-semibold">Dashboard</h1>
              {wallet.isConnected
                ? <p className="font-mono text-sm text-pearl-faint mt-1">{truncateAddr(wallet.address!,8)} · {chainName}</p>
                : <p className="font-sans text-sm text-pearl-faint mt-1">Connect to view your assets</p>
              }
            </div>
            <NotificationBell chainId={wallet.chainId} />
          </div>

          {!wallet.isConnected ? (
            <div className="flex flex-col items-center py-20 text-center max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{ background:"linear-gradient(135deg,rgba(124,58,237,0.2),rgba(6,182,212,0.1))", border:"1px solid rgba(124,58,237,0.25)" }}>
                <Wallet className="w-8 h-8 text-violet-light" />
              </div>
              <h2 className="font-display text-2xl text-pearl mb-2">Connect Your Wallet</h2>
              <p className="font-sans text-sm text-pearl-faint mb-7">View your NFTs, manage listings, and track earnings.</p>
              <button onClick={connect} disabled={wallet.isConnecting}
                className="px-8 py-3.5 rounded-2xl font-sans font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ background:"linear-gradient(135deg,#7C3AED,#06B6D4)", boxShadow:"0 4px 20px rgba(124,58,237,0.35)" }}>
                {wallet.isConnecting?"Connecting…":"Connect Wallet"}
              </button>
            </div>
          ) : (
            <>
              {/* Proceeds alert — always visible if has proceeds */}
              {hasProceeds && tab !== "earnings" && (
                <div className="flex items-center justify-between gap-4 p-4 rounded-2xl cursor-pointer" onClick={()=>setTab("earnings")}
                  style={{ background:"linear-gradient(135deg,rgba(34,197,94,0.1),rgba(6,182,212,0.05))", border:"1px solid rgba(34,197,94,0.25)", boxShadow:"0 0 20px rgba(34,197,94,0.08)" }}>
                  <div>
                    <p className="font-sans font-semibold text-sm text-green">💰 You have earnings ready to withdraw!</p>
                    <p className="font-sans text-xs text-pearl-faint mt-0.5">{proceeds.amountEth} ETH available — click to withdraw</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-green flex-shrink-0" />
                </div>
              )}

              {/* Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-2xl w-fit" style={{ background:"rgba(22,22,46,0.6)", border:"1px solid rgba(124,58,237,0.12)" }}>
                {TABS.map(({key,icon,label,count})=>(
                  <button key={key} onClick={()=>setTab(key)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans text-sm font-medium transition-all relative"
                    style={tab===key
                      ? { background:"linear-gradient(135deg,rgba(124,58,237,0.3),rgba(6,182,212,0.15))", color:"#F4F4FF", border:"1px solid rgba(124,58,237,0.3)" }
                      : { color:"#525280" }}>
                    {icon}{label}
                    {count!==null&&(
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono"
                        style={tab===key?{background:"rgba(124,58,237,0.2)",color:"#C084FC"}:{background:"rgba(22,22,46,0.8)",color:"#525280"}}>
                        {isLoading?"…":count}
                      </span>
                    )}
                    {key==="earnings"&&hasProceeds&&<span className="w-2 h-2 rounded-full bg-green absolute -top-0.5 -right-0.5 animate-pulse" />}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {tab === "nfts" && (
                isLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {Array.from({length:5}).map((_,i)=><NFTCardSkeleton key={i}/>)}
                  </div>
                ) : myNFTs.length===0 ? (
                  <Empty title="No NFTs owned" desc="You don't own any NFTs from this collection yet." link="/" linkLabel="Browse Marketplace" />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {myNFTs.map(nft=>(
                      <ProfileCard key={nft.tokenId} nft={nft} tab="nfts" isBusy={isBusy}
                        onList={()=>{setListTarget(nft);reset();}} onCancel={()=>handleCancel(nft.tokenId)} onUpdate={handleUpdatePrice}/>
                    ))}
                  </div>
                )
              )}

              {tab === "listings" && (
                isLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {Array.from({length:4}).map((_,i)=><NFTCardSkeleton key={i}/>)}
                  </div>
                ) : myListings.length===0 ? (
                  <Empty title="No active listings" desc="List one of your owned NFTs for sale." />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {myListings.map(nft=>(
                      <ProfileCard key={nft.tokenId} nft={nft} tab="listings" isBusy={isBusy}
                        onList={()=>{setListTarget(nft);reset();}} onCancel={()=>handleCancel(nft.tokenId)} onUpdate={handleUpdatePrice}/>
                    ))}
                  </div>
                )
              )}

              {tab === "earnings" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-3xl">
                  <WithdrawPanel proceeds={proceeds} withdrawTx={withdrawTx} explorerUrl={wUrl} isBusy={wBusy}
                    walletConnected={wallet.isConnected} isCorrectNetwork={isCorrectNetwork}
                    onWithdraw={withdrawProceeds} onDismiss={resetWTx} chainId={wallet.chainId} />

                  {/* Sales history */}
                  <div className="rounded-2xl overflow-hidden" style={{ background:"linear-gradient(135deg,rgba(22,22,46,0.9),rgba(13,13,24,0.95))", border:"1px solid rgba(124,58,237,0.12)" }}>
                    <div className="px-5 py-4" style={{ borderBottom:"1px solid rgba(124,58,237,0.1)" }}>
                      <p className="font-display text-base text-pearl">Sales History</p>
                      <p className="font-mono text-xs text-pearl-faint mt-0.5">{mySales.length} total sales</p>
                    </div>
                    <div className="divide-y" style={{ divideColor:"rgba(124,58,237,0.06)" }}>
                      {mySales.length===0?(
                        <div className="py-8 text-center"><p className="font-sans text-sm text-pearl-faint">No sales yet</p></div>
                      ):mySales.map(e=>(
                        <div key={e.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                          <div>
                            <div className="flex items-center gap-2">
                              <Link href={`/nft/${e.tokenId}`} className="font-sans font-semibold text-sm text-pearl hover:text-violet-light transition-colors">NFT #{e.tokenId}</Link>
                              <span className="px-2 py-0.5 rounded-full font-mono text-[9px]" style={{ background:"rgba(34,197,94,0.1)", color:"#22C55E", border:"1px solid rgba(34,197,94,0.2)" }}>SOLD</span>
                            </div>
                            <p className="font-mono text-xs text-pearl-faint mt-0.5">Buyer: {truncateAddr(e.buyer??"")}</p>
                          </div>
                          <p className="font-display text-base font-bold text-green">{e.priceEth} ETH</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {listTarget&&<ListModal nft={listTarget} tx={tx} explorerUrl={explorerUrl} isBusy={isBusy} onList={handleList} onClose={()=>{setListTarget(null);reset();}} onDismissTx={reset}/>}
    </div>
  );
}

function ProfileCard({nft,tab,isBusy,onList,onCancel,onUpdate}:{nft:NFTItem;tab:Tab;isBusy:boolean;onList:()=>void;onCancel:()=>void;onUpdate:(id:number,p:string)=>Promise<boolean>}) {
  const [loaded,setLoaded]=useState(false);
  const [cancelling,setCancelling]=useState(false);
  return (
    <div className="rounded-2xl overflow-hidden group transition-all hover:scale-[1.02]"
      style={{ background:"linear-gradient(135deg,rgba(22,22,46,0.9),rgba(13,13,24,0.95))", border:"1px solid rgba(124,58,237,0.12)" }}>
      <Link href={`/nft/${nft.tokenId}`}>
        <div className="relative aspect-square overflow-hidden">
          {nft.imageUrl?(<>
            {!loaded&&<Skeleton className="absolute inset-0"/>}
            <Image src={nft.imageUrl} alt={nft.metadata?.name??`#${nft.tokenId}`} fill className={`object-cover group-hover:scale-105 transition-all duration-500 ${loaded?"opacity-100":"opacity-0"}`} onLoad={()=>setLoaded(true)} sizes="20vw"/>
          </>):(
            <div className="absolute inset-0 flex items-center justify-center"><span className="font-display text-4xl text-pearl-ghost">{nft.tokenId}</span></div>
          )}
          {nft.listing?.isActive&&(
            <div className="absolute top-2 left-2"><span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold" style={{ background:"rgba(124,58,237,0.8)", color:"white", backdropFilter:"blur(4px)" }}>{nft.listing.priceEth} ETH</span></div>
          )}
        </div>
      </Link>
      <div className="p-3">
        <p className="font-sans font-semibold text-sm text-pearl truncate mb-2">{nft.metadata?.name??`NFT #${nft.tokenId}`}</p>
        {tab==="nfts"&&!nft.listing?.isActive&&(
          <button onClick={onList} disabled={isBusy} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl font-sans text-xs font-semibold text-pearl-dim hover:text-pearl transition-all" style={{ background:"rgba(22,22,46,0.6)", border:"1px solid rgba(124,58,237,0.2)" }}>
            <Tag className="w-3 h-3"/> List
          </button>
        )}
        {tab==="listings"&&nft.listing?.isActive&&(
          <div className="space-y-2">
            <PriceEditor currentPrice={nft.listing.priceEth} tokenId={nft.tokenId} isBusy={isBusy} onUpdate={onUpdate}/>
            <button onClick={async()=>{setCancelling(true);await onCancel();setCancelling(false);}} disabled={isBusy||cancelling}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl font-sans text-xs font-semibold text-red transition-all hover:bg-red/10" style={{ border:"1px solid rgba(239,68,68,0.2)" }}>
              {cancelling?<Spinner size="sm"/>:<X className="w-3 h-3"/>} Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Empty({title,desc,link,linkLabel}:{title:string;desc:string;link?:string;linkLabel?:string}) {
  return (
    <div className="flex flex-col items-center py-16 text-center rounded-2xl" style={{ background:"rgba(22,22,46,0.4)", border:"1px solid rgba(124,58,237,0.1)" }}>
      <PackageOpen className="w-10 h-10 text-pearl-ghost mb-4"/>
      <p className="font-display text-xl text-pearl mb-1">{title}</p>
      <p className="font-sans text-sm text-pearl-faint mb-5">{desc}</p>
      {link&&linkLabel&&<Link href={link} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-sans text-sm font-semibold text-white" style={{ background:"linear-gradient(135deg,#7C3AED,#06B6D4)" }}>{linkLabel}<ArrowRight className="w-4 h-4"/></Link>}
    </div>
  );
}
