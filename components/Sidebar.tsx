"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, User, Shield, Gem, ChevronLeft, ChevronRight, Wallet, AlertTriangle, Zap } from "lucide-react";
import type { WalletState } from "@/types";
import { truncateAddr } from "@/lib/utils";

interface Props {
  wallet: WalletState;
  isCorrectNetwork: boolean;
  targetChainName: string;
  isOwner: boolean;
  hasProceeds: boolean;
  proceedsEth: string;
  unreadCount: number;
  onConnect: () => void;
  onDisconnect: () => void;
  onSwitchNetwork: () => void;
}

const LINKS = [
  { href: "/", icon: LayoutGrid, label: "Marketplace" },
  { href: "/profile", icon: User, label: "Dashboard" },
];

export default function Sidebar({ wallet, isCorrectNetwork, targetChainName, isOwner, hasProceeds, proceedsEth, unreadCount, onConnect, onDisconnect, onSwitchNetwork }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const links = isOwner ? [...LINKS, { href: "/admin", icon: Shield, label: "Admin" }] : LINKS;

  return (
    <aside
      className={`relative hidden md:flex flex-col transition-all duration-300 flex-shrink-0 ${collapsed ? "w-16" : "w-56"}`}
      style={{
        background: "linear-gradient(180deg,#0D0D18 0%,#0A0A15 100%)",
        borderRight: "1px solid rgba(124,58,237,0.12)",
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 ${collapsed ? "justify-center" : ""}`}>
        <div className="relative w-8 h-8 flex-shrink-0">
          <div className="absolute inset-0 rounded-xl" style={{ background: "linear-gradient(135deg,#7C3AED,#06B6D4)", boxShadow: "0 0 16px rgba(124,58,237,0.4)" }}>
            <div className="w-full h-full flex items-center justify-center">
              <Gem className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>
        {!collapsed && (
          <div>
            <p className="font-display text-base text-pearl font-semibold leading-none">ArcMarket</p>
            <p className="font-mono text-[10px] text-pearl-faint mt-0.5">V3 PLATFORM</p>
          </div>
        )}
      </div>

      <div className="h-px mx-4" style={{ background: "linear-gradient(90deg,transparent,rgba(124,58,237,0.3),transparent)" }} />

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href === "/admin" && pathname === "/admin");
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${collapsed ? "justify-center" : ""} ${active
                  ? "text-white"
                  : "text-pearl-dim hover:text-pearl"
                }`}
              style={active ? { background: "linear-gradient(135deg,rgba(124,58,237,0.25),rgba(6,182,212,0.1))", border: "1px solid rgba(124,58,237,0.3)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" } : {}}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-violet-light" : ""}`} />
              {!collapsed && <span className="font-sans text-sm font-medium">{label}</span>}
              {label === "Admin" && !collapsed && (
                <span className="ml-auto text-[9px] font-mono bg-violet-pale text-violet-light px-1.5 py-0.5 rounded-full border border-violet/20">OWNER</span>
              )}
              {/* Tooltip for collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-space-100 border border-space-300 rounded-lg text-xs text-pearl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-glass">
                  {label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Proceeds alert */}
      {hasProceeds && !collapsed && (
        <div className="mx-3 mb-3 p-3 rounded-xl" style={{ background: "linear-gradient(135deg,rgba(34,197,94,0.1),rgba(6,182,212,0.05))", border: "1px solid rgba(34,197,94,0.2)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3 h-3 text-green" />
            <p className="font-mono text-[10px] text-green uppercase tracking-wider">Earnings Ready</p>
          </div>
          <p className="font-display text-lg text-green font-semibold">{proceedsEth} ETH</p>
          <Link href="/profile" className="mt-1.5 block text-center py-1.5 rounded-lg font-sans text-xs font-semibold text-white transition-all" style={{ background: "linear-gradient(135deg,#22C55E,#16A34A)" }}>
            Withdraw →
          </Link>
        </div>
      )}

      {/* Wrong network */}
      {wallet.isConnected && !isCorrectNetwork && !collapsed && (
        <div className="mx-3 mb-3 p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red" />
            <p className="font-sans text-xs text-red font-semibold">Wrong Network</p>
          </div>
          <button onClick={onSwitchNetwork} className="w-full py-1.5 rounded-lg font-sans text-xs font-bold text-white bg-red hover:opacity-90 transition-opacity">
            Switch to {targetChainName}
          </button>
        </div>
      )}

      {/* Wallet section */}
      <div className="p-3 border-t" style={{ borderColor: "rgba(124,58,237,0.12)" }}>
        {wallet.isConnected ? (
          <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
            <div className="relative flex-shrink-0">
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7C3AED,#06B6D4)" }}>
                <Wallet className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green border-2" style={{ borderColor: "#0D0D18" }} />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-pearl truncate">{truncateAddr(wallet.address!, 4)}</p>
                <button onClick={onDisconnect} className="font-sans text-[10px] text-pearl-faint hover:text-red transition-colors">Disconnect</button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={onConnect} disabled={wallet.isConnecting}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-sans text-sm font-semibold text-white transition-all ${collapsed ? "justify-center w-full" : ""}`}
            style={{ background: "linear-gradient(135deg,#7C3AED,#06B6D4)", boxShadow: "0 0 20px rgba(124,58,237,0.3)" }}>
            <Wallet className="w-4 h-4 flex-shrink-0" />
            {!collapsed && (wallet.isConnecting ? "Connecting…" : "Connect")}
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="absolute -right-3 top-8 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all hover:scale-110"
        style={{ background: "#161626", border: "1px solid rgba(124,58,237,0.3)", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
        {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-violet" /> : <ChevronLeft className="w-3.5 h-3.5 text-violet" />}
      </button>
    </aside>
  );
}

// Mobile topbar for small screens
export function MobileTopbar({ wallet, onConnect, onDisconnect, unreadCount, hasProceeds }: { wallet: WalletState; onConnect: () => void; onDisconnect: () => void; unreadCount: number; hasProceeds: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const links = [{ href: "/", label: "Market" }, { href: "/profile", label: "Dashboard" }, { href: "/admin", label: "Admin" }];

  return (
    <header className="md:hidden sticky top-0 z-40" style={{ background: "rgba(8,8,14,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(124,58,237,0.12)" }}>
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7C3AED,#06B6D4)" }}>
            <Gem className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display text-base text-pearl">ArcMarket</span>
          {hasProceeds && <span className="w-2 h-2 rounded-full bg-green animate-pulse" />}
        </div>
        <div className="flex items-center gap-2">
          {wallet.isConnected
            ? <button onClick={onDisconnect} className="font-mono text-xs text-pearl-dim px-3 py-1.5 rounded-lg" style={{ background: "rgba(22,22,46,0.8)", border: "1px solid rgba(124,58,237,0.2)" }}>{truncateAddr(wallet.address!, 4)}</button>
            : <button onClick={onConnect} className="font-sans text-xs font-bold text-white px-3 py-1.5 rounded-lg" style={{ background: "linear-gradient(135deg,#7C3AED,#06B6D4)" }}>Connect</button>
          }
          <button onClick={() => setMenuOpen(v => !v)} className="p-2 text-pearl-dim">
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="flex border-t" style={{ borderColor: "rgba(124,58,237,0.12)" }}>
          {links.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)}
              className={`flex-1 text-center py-3 font-sans text-xs font-medium transition-colors ${pathname === href ? "text-violet-light bg-violet-pale" : "text-pearl-dim"}`}>
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
