"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Tag, ShoppingBag, X, ExternalLink, User, Layers, RefreshCw, ImageOff, Pencil } from "lucide-react";
import Sidebar, { MobileTopbar } from "@/components/Sidebar";
import BuyPanel from "@/components/BuyPanel";
import ListModal from "@/components/ListModal";
import PriceEditor from "@/components/PriceEditor";
import { Skeleton, Spinner } from "@/components/Loader";
import NotificationBell from "@/components/NotificationBell";
import { useWallet } from "@/hooks/useWallet";
import { useNFTs } from "@/hooks/useNFTs";
import { useMarketplace } from "@/hooks/useMarketplace";
import { useProceeds } from "@/hooks/useProceeds";
import { useAdmin } from "@/hooks/useAdmin";
import { notificationStore } from "@/lib/notifications";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import { truncateAddr, addrUrl, resolveIpfs, calcFeeBreakdown } from "@/lib/utils";
import type { NFTItem } from "@/types";

export default function NFTDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tokenId = parseInt(params.id as string);

  const { wallet,provider,signer,connect,disconnect,switchNetwork,isCorrectNetwork,chainName,targetChainName } = useWallet();
  const { nfts,isLoading:nftsLoading,fetchNFTs,isApproved,approveMarketplace } = useNFTs();
  const { tx,explorerUrl,gasPreview,isBusy,reset,feePercent,fetchPlatformFee,fetchListing,estimateBuyGas,listItem,buyItem,cancelListing,updateListing } = useMarketplace(signer,wallet.chainId);
  const { proceeds,fetchProceeds,hasProceeds } = useProceeds(signer,wallet.chainId);
  const { isOwner:isContractOwner,checkOwner } = useAdmin(signer,wallet.chainId);

  const [nft,setNft]         = useState<NFTItem|null>(null);
  const [imgLoaded,setImgLoaded] = useState(false);
  const [imgError,setImgError]   = useState(false);
  const [showBuy,setShowBuy]     = useState(false);
  const [showList,setShowList]   = useState(false);
  const [cancelLoading,setCancelLoading] = useState(false);

  useEffect(()=>{
    if (isNaN(tokenId)||tokenId<1||tokenId>CONTRACT_ADDRESSES.maxSupply) router.replace("/");
  },[tokenId,router]);

  useEffect(()=>{
    if (!provider) return;
    fetchNFTs(provider);
    fetchPlatformFee(provider);
    if (wallet.address){fetchProceeds(provider,wallet.address);checkOwner(provider,wallet.address);}
  },[provider,wallet.address,fetchNFTs,fetchPlatformFee,fetchProceeds,checkOwner]);

  useEffect(()=>{
    const found=nfts.find(n=>n.tokenId===tokenId);
    if (!found) return;
    if (!provider){setNft(found);return;}
    fetchListing(provider,tokenId).then(l=>setNft({...found,listing:l??null}));
  },[nfts,tokenId,provider,fetchListing]);

  useEffect(()=>{
    if (tx.status==="error"&&tx.error) toast.error(tx.error);
    if (tx.status==="success"){
      const msgs:Record<string,string>={list:"NFT Listed!",buy:"NFT Purchased! 🎉",cancel:"Listing Cancelled.",update:"Price Updated!"};
      if (tx.action) toast.success(msgs[tx.action]??"Done!");
      if (provider) fetchListing(provider,tokenId).then(l=>setNft(p=>p?{...p,listing:l??null}:p));
      if (tx.action==="update") notificationStore.push("update","Price Updated",`NFT #${tokenId} price updated`,tx.hash??undefined);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[tx.status]);

  const handleOpenBuy = useCallback(async()=>{
    if (!nft?.listing) return;
    setShowBuy(true);reset();
    await estimateBuyGas(tokenId,nft.listing.price);
  },[nft,reset,estimateBuyGas,tokenId]);

  const handleBuy = useCallback(async()=>{
    if (!nft?.listing) return;
    await buyItem(tokenId,nft.listing.price);
  },[nft,buyItem,tokenId]);

  const handleCancel = useCallback(async()=>{
    setCancelLoading(true);
    await cancelListing(tokenId);
    setCancelLoading(false);
  },[tokenId,cancelListing]);

  const handleUpdatePrice = useCallback(async(id:number,newPrice:string):Promise<boolean>=>{
    const ok = await updateListing(id,newPrice);
    if (ok&&provider) {
      const l=await fetchListing(provider,tokenId);
      setNft(p=>p?{...p,listing:l??null}:p);
    }
    return ok;
  },[updateListing,provider,fetchListing,tokenId]);

  const addr   = wallet.address?.toLowerCase();
  const owner  = nft?.owner?.toLowerCase();
  const seller = nft?.listing?.seller?.toLowerCase();
  const isOwner  = !!addr&&addr===owner;
  const isSeller = !!addr&&addr===seller;
  const isListed = !!nft?.listing?.isActive;
  const canBuy    = isListed&&!!addr&&!isOwner&&!isSeller;
  const canList   = isOwner&&!isListed;
  const canCancel = isSeller&&isListed;
  const canUpdate = isSeller&&isListed;

  const breakdown = nft?.listing ? calcFeeBreakdown(nft.listing.price, feePercent) : null;

  return (
    <div className="flex min-h-screen">
      <Sidebar wallet={wallet} isCorrectNetwork={isCorrectNetwork} targetChainName={targetChainName} isOwner={isContractOwner}
        hasProceeds={hasProceeds} proceedsEth={proceeds.amountEth} unreadCount={0}
        onConnect={connect} onDisconnect={disconnect} onSwitchNetwork={switchNetwork} />

      <div className="flex-1 flex flex-col min-w-0">
        <MobileTopbar wallet={wallet} onConnect={connect} onDisconnect={disconnect} unreadCount={0} hasProceeds={hasProceeds} />

        <main className="flex-1 p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <button onClick={()=>router.back()}
              className="flex items-center gap-2 font-sans text-sm text-pearl-faint hover:text-pearl transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back
            </button>
            <NotificationBell chainId={wallet.chainId} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 max-w-6xl">
            {/* Left: Image */}
            <div>
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-glass-lg"
                style={{ background:"linear-gradient(135deg,rgba(22,22,46,0.9),rgba(13,13,24,0.95))", border:"1px solid rgba(124,58,237,0.15)" }}>
                {nftsLoading&&!nft ? <Skeleton className="absolute inset-0" /> :
                  nft?.imageUrl&&!imgError ? (
                    <>
                      {!imgLoaded&&<Skeleton className="absolute inset-0"/>}
                      <Image src={nft.imageUrl} alt={nft.metadata?.name??`#${tokenId}`} fill priority
                        className={`object-cover transition-all duration-700 ${imgLoaded?"opacity-100 scale-100":"opacity-0 scale-105"}`}
                        onLoad={()=>setImgLoaded(true)} onError={()=>setImgError(true)}
                        sizes="(max-width:1024px) 100vw, 50vw" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                      style={{ background:"linear-gradient(135deg,rgba(22,22,46,0.8),rgba(13,13,24,0.9))" }}>
                      <div className="absolute inset-0" style={{ background:"radial-gradient(circle at 30% 40%,rgba(124,58,237,0.2) 0%,transparent 50%),radial-gradient(circle at 70% 70%,rgba(6,182,212,0.15) 0%,transparent 50%)" }} />
                      {imgError?<ImageOff className="w-14 h-14 text-pearl-faint relative z-10"/>:<span className="font-display text-8xl text-pearl-ghost relative z-10">{tokenId}</span>}
                    </div>
                  )
                }
                {/* Gradient overlay bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background:"linear-gradient(to top,rgba(8,8,14,0.4),transparent)" }} />
              </div>

              {/* Attributes */}
              {nft?.metadata?.attributes&&nft.metadata.attributes.length>0&&(
                <div className="mt-6">
                  <p className="font-mono text-xs text-pearl-faint uppercase tracking-widest mb-3">Attributes</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {nft.metadata.attributes.map((a,i)=>(
                      <div key={i} className="p-3 rounded-xl text-center transition-all hover:border-violet/30"
                        style={{ background:"rgba(22,22,46,0.7)", border:"1px solid rgba(124,58,237,0.12)" }}>
                        <p className="font-mono text-[10px] text-pearl-faint uppercase tracking-wider mb-1">{a.trait_type}</p>
                        <p className="font-sans font-semibold text-xs text-pearl truncate">{a.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Info + Actions */}
            <div className="flex flex-col gap-6">
              {/* Title */}
              {nftsLoading&&!nft
                ? <><Skeleton className="h-12 w-3/4"/><Skeleton className="h-5 w-1/2"/></>
                : (
                  <div>
                    <div className="flex items-start gap-3 mb-2">
                      <h1 className="font-display text-4xl sm:text-5xl text-pearl leading-tight flex-1">
                        {nft?.metadata?.name??`NFT #${tokenId}`}
                      </h1>
                      <span className="flex-shrink-0 mt-2 font-mono text-sm text-pearl-faint px-2.5 py-1 rounded-lg" style={{ background:"rgba(22,22,46,0.8)", border:"1px solid rgba(124,58,237,0.15)" }}>#{tokenId}</span>
                    </div>
                    {nft?.metadata?.description&&<p className="font-sans text-sm text-pearl-faint leading-relaxed">{nft.metadata.description}</p>}
                  </div>
                )
              }

              {/* Status + Owner badge */}
              {!nftsLoading&&nft&&(
                <div className="flex flex-wrap items-center gap-2">
                  {isListed
                    ? <span className="flex items-center gap-2 px-3 py-1.5 rounded-full font-sans text-sm font-semibold"
                        style={{ background:"rgba(124,58,237,0.15)", border:"1px solid rgba(124,58,237,0.3)", color:"#C084FC" }}>
                        <span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-violet-light opacity-60"/><span className="relative h-2 w-2 rounded-full bg-violet-light"/></span>
                        Listed
                      </span>
                    : <span className="px-3 py-1.5 rounded-full font-sans text-sm" style={{ background:"rgba(22,22,46,0.8)", border:"1px solid rgba(82,82,128,0.3)", color:"#525280" }}>Unlisted</span>
                  }
                  {isOwner&&<span className="px-3 py-1.5 rounded-full font-sans text-xs font-semibold" style={{ background:"rgba(245,158,11,0.12)", border:"1px solid rgba(245,158,11,0.25)", color:"#F59E0B" }}>Your NFT</span>}
                </div>
              )}

              {/* Info table */}
              <div className="rounded-2xl overflow-hidden" style={{ border:"1px solid rgba(124,58,237,0.12)" }}>
                {[
                  { icon:<User className="w-3.5 h-3.5"/>, label:"Owner", val:nftsLoading&&!nft?null:nft?.owner?(isOwner?"You":truncateAddr(nft.owner,6)):"—", link:!isOwner&&nft?.owner?addrUrl(nft.owner,wallet.chainId??1):null },
                  { icon:<Tag className="w-3.5 h-3.5"/>, label:"Seller", val:nftsLoading&&!nft?null:isListed&&nft?.listing?.seller?(isSeller?"You":truncateAddr(nft.listing.seller,6)):"—", link:isListed&&!isSeller&&nft?.listing?.seller?addrUrl(nft.listing.seller,wallet.chainId??1):null },
                  { icon:<Layers className="w-3.5 h-3.5"/>, label:"Contract", val:truncateAddr(CONTRACT_ADDRESSES.nft,6), link:addrUrl(CONTRACT_ADDRESSES.nft,wallet.chainId??1) },
                ].map(({icon,label,val,link})=>(
                  <div key={label} className="flex items-center justify-between px-4 py-3" style={{ borderBottom:"1px solid rgba(124,58,237,0.06)", background:"rgba(22,22,46,0.4)" }}>
                    <div className="flex items-center gap-2 text-pearl-faint">{icon}<span className="font-sans text-sm">{label}</span></div>
                    {val===null?<Skeleton className="h-4 w-24"/>:(
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm text-pearl">{val}</span>
                        {link&&<a href={link} target="_blank" rel="noopener noreferrer" className="text-pearl-faint hover:text-violet-light transition-colors"><ExternalLink className="w-3 h-3"/></a>}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Price section (inline editing for sellers) */}
              {isListed && nft?.listing && (
                <div className="p-5 rounded-2xl" style={{ background:"linear-gradient(135deg,rgba(124,58,237,0.1),rgba(6,182,212,0.05))", border:"1px solid rgba(124,58,237,0.2)" }}>
                  {canUpdate
                    ? <PriceEditor currentPrice={nft.listing.priceEth} tokenId={tokenId} isBusy={isBusy} onUpdate={handleUpdatePrice} />
                    : (
                      <>
                        <p className="font-mono text-xs text-pearl-faint uppercase tracking-widest mb-1">Sale Price</p>
                        <p className="font-display text-4xl font-bold text-violet-glow">{nft.listing.priceEth} ETH</p>
                      </>
                    )
                  }
                  {/* Fee breakdown */}
                  {breakdown && !canUpdate && (
                    <div className="mt-4 pt-4 space-y-1.5" style={{ borderTop:"1px solid rgba(124,58,237,0.15)" }}>
                      <div className="flex justify-between">
                        <span className="font-sans text-xs text-pearl-faint">You pay</span>
                        <span className="font-mono text-xs text-pearl">{breakdown.priceEth} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-sans text-xs text-pearl-faint">Platform fee ({breakdown.feePercent}%)</span>
                        <span className="font-mono text-xs text-pearl-faint">{breakdown.feeEth} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-sans text-xs text-pearl-faint">Seller receives</span>
                        <span className="font-mono text-xs text-cyan">{breakdown.sellerReceivesEth} ETH</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic action buttons */}
              {!nftsLoading&&nft&&(
                <div className="flex flex-col gap-3">
                  {!wallet.isConnected&&(
                    <button onClick={connect} className="flex items-center justify-center gap-2 py-4 rounded-2xl font-sans font-bold text-base text-white transition-all hover:opacity-90 active:scale-95"
                      style={{ background:"linear-gradient(135deg,#7C3AED,#06B6D4)", boxShadow:"0 4px 20px rgba(124,58,237,0.35)" }}>
                      Connect Wallet
                    </button>
                  )}
                  {canBuy&&(
                    <button onClick={handleOpenBuy} disabled={isBusy||!isCorrectNetwork}
                      className="flex items-center justify-center gap-2 py-4 rounded-2xl font-sans font-bold text-base text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                      style={{ background:"linear-gradient(135deg,#7C3AED,#06B6D4)", boxShadow:"0 4px 20px rgba(124,58,237,0.35)" }}>
                      <ShoppingBag className="w-5 h-5" /> Buy for {nft.listing?.priceEth} ETH
                    </button>
                  )}
                  {canList&&(
                    <button onClick={()=>{setShowList(true);reset();}} disabled={isBusy||!isCorrectNetwork}
                      className="flex items-center justify-center gap-2 py-4 rounded-2xl font-sans font-bold text-base text-pearl-dim hover:text-pearl transition-all disabled:opacity-50"
                      style={{ background:"rgba(22,22,46,0.7)", border:"1px solid rgba(124,58,237,0.25)" }}>
                      <Tag className="w-5 h-5" /> List for Sale
                    </button>
                  )}
                  {canCancel&&(
                    <button onClick={handleCancel} disabled={isBusy||cancelLoading||!isCorrectNetwork}
                      className="flex items-center justify-center gap-2 py-4 rounded-2xl font-sans font-bold text-base text-red transition-all hover:bg-red/10 disabled:opacity-50"
                      style={{ border:"1px solid rgba(239,68,68,0.25)" }}>
                      {cancelLoading?<Spinner size="sm" color="white"/>:<X className="w-5 h-5"/>} Cancel Listing
                    </button>
                  )}
                  {!wallet.isConnected||(!canBuy&&!canList&&!canCancel)&&wallet.isConnected&&(
                    <div className="py-4 text-center rounded-2xl font-sans text-sm text-pearl-faint" style={{ background:"rgba(22,22,46,0.4)", border:"1px solid rgba(82,82,128,0.15)" }}>
                      {isListed?"Listed — not available for your actions":"Not currently for sale"}
                    </div>
                  )}
                </div>
              )}

              {/* Metadata link */}
              {nft?.tokenUri&&(
                <a href={resolveIpfs(nft.tokenUri)} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-mono text-xs text-pearl-faint hover:text-violet-light transition-colors">
                  <RefreshCw className="w-3 h-3"/> View IPFS Metadata
                </a>
              )}
            </div>
          </div>
        </main>
      </div>

      {showBuy&&nft&&<BuyPanel nft={nft} tx={tx} explorerUrl={explorerUrl} gasPreview={gasPreview} isBusy={isBusy} feePercent={feePercent} chainId={wallet.chainId} onBuy={handleBuy} onClose={()=>{setShowBuy(false);reset();}} onDismissTx={reset}/>}
      {showList&&nft&&<ListModal nft={nft} tx={tx} explorerUrl={explorerUrl} isBusy={isBusy} onList={(id,p)=>listItem(id,p,isApproved,approveMarketplace)} onClose={()=>{setShowList(false);reset();}} onDismissTx={reset}/>}
    </div>
  );
}
