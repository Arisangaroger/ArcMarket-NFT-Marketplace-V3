"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Shield, ShieldOff, ArrowLeft } from "lucide-react";
import Sidebar, { MobileTopbar } from "@/components/Sidebar";
import AdminStats from "@/components/AdminStats";
import NotificationBell from "@/components/NotificationBell";
import { Skeleton } from "@/components/Loader";
import { useWallet } from "@/hooks/useWallet";
import { useMarketplace } from "@/hooks/useMarketplace";
import { useProceeds } from "@/hooks/useProceeds";
import { useAdmin } from "@/hooks/useAdmin";
import { useEvents } from "@/hooks/useEvents";
import { truncateAddr } from "@/lib/utils";

export default function AdminPage() {
  const { wallet,provider,signer,connect,disconnect,switchNetwork,isCorrectNetwork,chainName,targetChainName } = useWallet();
  const { feePercent,fetchPlatformFee } = useMarketplace(signer,wallet.chainId);
  const { hasProceeds,proceeds,fetchProceeds } = useProceeds(signer,wallet.chainId);
  const { stats,isOwner,withdrawTx,explorerUrl,isBusy,checkOwner,fetchAdminStats,withdrawFees,resetTx } = useAdmin(signer,wallet.chainId);
  const { events,fetchEvents } = useEvents();

  useEffect(()=>{
    if (!provider) return;
    fetchPlatformFee(provider);
    fetchEvents(provider);
    if (wallet.address){fetchProceeds(provider,wallet.address);checkOwner(provider,wallet.address);}
  },[provider,wallet.address,fetchPlatformFee,fetchEvents,fetchProceeds,checkOwner]);

  useEffect(()=>{
    if (events.length>0&&provider) fetchAdminStats(provider,events);
  },[events,provider,fetchAdminStats]);

  useEffect(()=>{
    if (withdrawTx.status==="success") toast.success("Platform fees withdrawn!");
    if (withdrawTx.status==="error"&&withdrawTx.error) toast.error(withdrawTx.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[withdrawTx.status]);

  // Access guard states
  if (!wallet.isConnected) return (
    <div className="flex min-h-screen">
      <Sidebar wallet={wallet} isCorrectNetwork={isCorrectNetwork} targetChainName={targetChainName} isOwner={false}
        hasProceeds={false} proceedsEth="0" unreadCount={0}
        onConnect={connect} onDisconnect={disconnect} onSwitchNetwork={switchNetwork} />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <ShieldOff className="w-12 h-12 text-pearl-faint mx-auto mb-4"/>
          <h2 className="font-display text-2xl text-pearl mb-2">Wallet Required</h2>
          <p className="font-sans text-sm text-pearl-faint mb-7">Connect your owner wallet to access the admin panel.</p>
          <button onClick={connect} disabled={wallet.isConnecting}
            className="px-8 py-3.5 rounded-2xl font-sans font-bold text-sm text-white" style={{ background:"linear-gradient(135deg,#7C3AED,#06B6D4)" }}>
            {wallet.isConnecting?"Connecting…":"Connect Wallet"}
          </button>
        </div>
      </div>
    </div>
  );

  if (!isCorrectNetwork) return (
    <div className="flex min-h-screen">
      <Sidebar wallet={wallet} isCorrectNetwork={isCorrectNetwork} targetChainName={targetChainName} isOwner={false}
        hasProceeds={false} proceedsEth="0" unreadCount={0}
        onConnect={connect} onDisconnect={disconnect} onSwitchNetwork={switchNetwork} />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="font-display text-2xl text-pearl mb-2">Wrong Network</h2>
          <p className="font-sans text-sm text-pearl-faint mb-7">Switch to <span className="text-violet-light font-semibold">{targetChainName}</span> to continue.</p>
          <button onClick={switchNetwork} className="px-8 py-3.5 rounded-2xl font-sans font-bold text-sm text-white" style={{ background:"linear-gradient(135deg,#EF4444,#B91C1C)" }}>
            Switch Network
          </button>
        </div>
      </div>
    </div>
  );

  if (!stats.isLoading && !isOwner) return (
    <div className="flex min-h-screen">
      <Sidebar wallet={wallet} isCorrectNetwork={isCorrectNetwork} targetChainName={targetChainName} isOwner={false}
        hasProceeds={false} proceedsEth="0" unreadCount={0}
        onConnect={connect} onDisconnect={disconnect} onSwitchNetwork={switchNetwork} />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <ShieldOff className="w-12 h-12 text-red mx-auto mb-4"/>
          <h2 className="font-display text-2xl text-pearl mb-2">Access Denied</h2>
          <p className="font-sans text-sm text-pearl-faint mb-7">This panel is restricted to the contract owner.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-sans text-sm font-semibold text-pearl-dim" style={{ background:"rgba(22,22,46,0.8)", border:"1px solid rgba(124,58,237,0.2)" }}>
            <ArrowLeft className="w-4 h-4"/> Back to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar wallet={wallet} isCorrectNetwork={isCorrectNetwork} targetChainName={targetChainName} isOwner={isOwner}
        hasProceeds={hasProceeds} proceedsEth={proceeds.amountEth} unreadCount={0}
        onConnect={connect} onDisconnect={disconnect} onSwitchNetwork={switchNetwork} />

      <div className="flex-1 flex flex-col min-w-0">
        <MobileTopbar wallet={wallet} onConnect={connect} onDisconnect={disconnect} unreadCount={0} hasProceeds={hasProceeds} />

        <main className="flex-1 p-6 md:p-8 space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-xl" style={{ background:"linear-gradient(135deg,rgba(124,58,237,0.25),rgba(6,182,212,0.1))", border:"1px solid rgba(124,58,237,0.3)", boxShadow:"0 0 16px rgba(124,58,237,0.2)" }}>
                  <Shield className="w-5 h-5 text-violet-light" />
                </div>
                <h1 className="font-display text-3xl md:text-4xl text-pearl font-semibold">Admin Panel</h1>
                <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold" style={{ background:"rgba(124,58,237,0.15)", color:"#C084FC", border:"1px solid rgba(124,58,237,0.25)" }}>OWNER</span>
              </div>
              <p className="font-mono text-sm text-pearl-faint">{truncateAddr(wallet.address!,8)} · {chainName}</p>
            </div>
            <NotificationBell chainId={wallet.chainId} />
          </div>

          {/* Platform fee info */}
          <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background:"rgba(22,22,46,0.6)", border:"1px solid rgba(124,58,237,0.15)" }}>
            <div className="p-2.5 rounded-xl" style={{ background:"rgba(6,182,212,0.1)", border:"1px solid rgba(6,182,212,0.2)" }}>
              <Shield className="w-4 h-4 text-cyan" />
            </div>
            <div>
              <p className="font-sans text-sm font-semibold text-pearl">Platform Fee: {feePercent/100}%</p>
              <p className="font-mono text-xs text-pearl-faint">Charged on every sale. Seller receives {100-feePercent/100}% of price.</p>
            </div>
          </div>

          {/* Admin stats */}
          {stats.isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">{Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-24 rounded-2xl"/>)}</div>
              <Skeleton className="h-36 rounded-2xl"/>
            </div>
          ) : (
            <AdminStats
              stats={stats} withdrawTx={withdrawTx} explorerUrl={explorerUrl}
              isBusy={isBusy} isCorrectNetwork={isCorrectNetwork}
              onWithdraw={withdrawFees} onDismiss={resetTx} events={events} />
          )}
        </main>
      </div>
    </div>
  );
}
