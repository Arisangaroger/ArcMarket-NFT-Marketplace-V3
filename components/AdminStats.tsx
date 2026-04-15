"use client";
import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, ShoppingBag, Banknote, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { AdminStats as AdminStatsType, TxState, ActivityEvent } from "@/types";
import { Skeleton } from "./Loader";

interface Props {
  stats: AdminStatsType;
  withdrawTx: TxState;
  explorerUrl: string | null;
  isBusy: boolean;
  isCorrectNetwork: boolean;
  onWithdraw: () => void;
  onDismiss: () => void;
  events: ActivityEvent[];
}

export default function AdminStats({ stats, withdrawTx, explorerUrl, isBusy, isCorrectNetwork, onWithdraw, onDismiss, events }: Props) {
  // Build volume chart data from sold events grouped by block ranges
  const chartData = React.useMemo(() => {
    const sales = events.filter(e => e.type === "sold").slice(0, 10).reverse();
    return sales.map((e, i) => ({
      name: `#${e.tokenId}`,
      volume: parseFloat(e.priceEth ?? "0"),
    }));
  }, [events]);

  const statCards = [
    { icon: <ShoppingBag className="w-4 h-4" />, label: "Total Sales", value: stats.isLoading ? null : stats.totalSales.toString(), color: "text-violet-light", bg: "rgba(124,58,237,0.1)", border: "rgba(124,58,237,0.2)" },
    { icon: <TrendingUp className="w-4 h-4" />, label: "Total Volume", value: stats.isLoading ? null : `${stats.totalVolume} ETH`, color: "text-cyan", bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.2)" },
    { icon: <Banknote className="w-4 h-4" />, label: "Fees Earned", value: stats.isLoading ? null : `${stats.totalFees} ETH`, color: "text-green", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)" },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map(({ icon, label, value, color, bg, border }) => (
          <div key={label} className="rounded-2xl p-5"
            style={{ background: "linear-gradient(135deg,rgba(22,22,46,0.9),rgba(13,13,24,0.95))", border: "1px solid rgba(124,58,237,0.12)" }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg" style={{ background: bg, border: `1px solid ${border}` }}>
                <span className={color}>{icon}</span>
              </div>
              <span className="font-mono text-xs text-pearl-faint uppercase tracking-wider">{label}</span>
            </div>
            {value === null
              ? <Skeleton className="h-8 w-24" />
              : <p className={`font-display text-3xl font-bold ${color}`}>{value}</p>
            }
          </div>
        ))}
      </div>

      {/* Platform balance + withdraw */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg,rgba(22,46,30,0.9),rgba(13,24,18,0.95))", border: "1px solid rgba(34,197,94,0.2)" }}>
        <div className="h-[2px]" style={{ background: "linear-gradient(90deg,transparent,#22C55E,transparent)" }} />
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-mono text-xs text-pearl-faint uppercase tracking-wider mb-1">Platform Balance</p>
              {stats.isLoading
                ? <Skeleton className="h-10 w-36" />
                : <p className="font-display text-4xl font-bold text-green">{stats.platformBalanceEth} ETH</p>
              }
              <p className="font-sans text-xs text-pearl-faint mt-1">Accumulated marketplace fees</p>
            </div>

            <button
              onClick={onWithdraw}
              disabled={isBusy || !isCorrectNetwork || stats.platformBalance === BigInt(0)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-sans font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#22C55E,#16A34A)", boxShadow: "0 4px 16px rgba(34,197,94,0.3)" }}>
              {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
              {isBusy ? (withdrawTx.status === "confirming" ? "Confirming…" : "Withdrawing…") : "Withdraw Fees"}
            </button>
          </div>

          {withdrawTx.status === "success" && (
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <CheckCircle2 className="w-4 h-4 text-green" />
              <p className="font-sans text-sm text-green font-semibold">Fees withdrawn successfully!</p>
              <button onClick={onDismiss} className="ml-auto text-pearl-faint hover:text-pearl text-xs">✕</button>
            </div>
          )}
          {withdrawTx.status === "error" && (
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertCircle className="w-4 h-4 text-red" />
              <p className="font-mono text-xs text-red">{withdrawTx.error}</p>
              <button onClick={onDismiss} className="ml-auto text-pearl-faint hover:text-pearl text-xs">✕</button>
            </div>
          )}
        </div>
      </div>

      {/* Volume Chart */}
      {chartData.length > 0 && (
        <div className="rounded-2xl p-6"
          style={{ background: "linear-gradient(135deg,rgba(22,22,46,0.9),rgba(13,13,24,0.95))", border: "1px solid rgba(124,58,237,0.12)" }}>
          <p className="font-mono text-xs text-pearl-faint uppercase tracking-wider mb-5">Recent Sales Volume (ETH)</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: "#525280", fontSize: 11, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#525280", fontSize: 11, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "rgba(13,13,24,0.95)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "12px", fontFamily: "Space Mono", fontSize: "11px", color: "#F4F4FF" }}
                cursor={{ fill: "rgba(124,58,237,0.05)" }}
              />
              <Bar dataKey="volume" radius={[6, 6, 0, 0]}
                fill="url(#barGrad)" />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
