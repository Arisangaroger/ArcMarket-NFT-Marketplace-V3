"use client";
import React, { useState, useEffect } from "react";
import { Bell, X, Tag, ShoppingBag, RefreshCw, Banknote, AlertCircle, Check } from "lucide-react";
import type { Notification } from "@/types";
import { notificationStore } from "@/lib/notifications";
import { txUrl } from "@/lib/utils";

interface Props { chainId: number | null; }

const TYPE_CONFIG = {
  sale:     { icon:<ShoppingBag className="w-4 h-4"/>, color:"text-green",     bg:"bg-green/10 border-green/20" },
  listing:  { icon:<Tag className="w-4 h-4"/>,         color:"text-violet-light",bg:"bg-violet-pale border-violet/20" },
  cancel:   { icon:<X className="w-4 h-4"/>,           color:"text-red",        bg:"bg-red/10 border-red/20" },
  update:   { icon:<RefreshCw className="w-4 h-4"/>,   color:"text-cyan",       bg:"bg-cyan-pale border-cyan/20" },
  withdraw: { icon:<Banknote className="w-4 h-4"/>,    color:"text-green",      bg:"bg-green/10 border-green/20" },
  error:    { icon:<AlertCircle className="w-4 h-4"/>, color:"text-red",        bg:"bg-red/10 border-red/20" },
} as const;

export default function NotificationBell({ chainId }: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    return notificationStore.subscribe(setNotifications);
  }, []);

  const unread = notifications.filter(n => !n.read).length;

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open) notificationStore.markAllRead();
  };

  return (
    <div className="relative">
      <button onClick={handleOpen}
        className="relative p-2 rounded-xl transition-all hover:scale-105"
        style={{background:"rgba(22,22,46,0.8)",border:"1px solid rgba(124,58,237,0.2)"}}>
        <Bell className={`w-4 h-4 ${unread>0?"text-violet-light":"text-pearl-dim"}`} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center font-mono text-[9px] text-white font-bold animate-bounce-in"
            style={{background:"linear-gradient(135deg,#7C3AED,#06B6D4)"}}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-50 w-80 rounded-2xl overflow-hidden shadow-modal animate-scale-in"
            style={{background:"rgba(13,13,24,0.98)",border:"1px solid rgba(124,58,237,0.2)",backdropFilter:"blur(20px)"}}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{borderBottom:"1px solid rgba(124,58,237,0.15)"}}>
              <span className="font-display text-sm text-pearl">Notifications</span>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button onClick={() => notificationStore.clear()} className="font-mono text-[10px] text-pearl-faint hover:text-pearl transition-colors">Clear all</button>
                )}
                <button onClick={() => setOpen(false)} className="text-pearl-faint hover:text-pearl">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="w-8 h-8 text-pearl-faint mx-auto mb-2" />
                  <p className="font-sans text-sm text-pearl-faint">No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0,20).map(n => {
                  const cfg = TYPE_CONFIG[n.type];
                  return (
                    <div key={n.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                      style={{borderBottom:"1px solid rgba(124,58,237,0.06)"}}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${cfg.bg} ${cfg.color}`}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-semibold text-xs text-pearl">{n.title}</p>
                        <p className="font-sans text-xs text-pearl-dim mt-0.5 leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="font-mono text-[10px] text-pearl-faint">{new Date(n.timestamp).toLocaleTimeString()}</p>
                          {n.txHash && chainId && (
                            <a href={txUrl(n.txHash,chainId)} target="_blank" rel="noopener noreferrer"
                              className="font-mono text-[10px] text-violet-light hover:underline">
                              View tx
                            </a>
                          )}
                        </div>
                      </div>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-violet flex-shrink-0 mt-1" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
