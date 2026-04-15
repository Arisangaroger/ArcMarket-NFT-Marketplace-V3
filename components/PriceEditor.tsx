"use client";
import React, { useState, useRef, useEffect } from "react";
import { Pencil, Check, X, Loader2 } from "lucide-react";

interface Props {
  currentPrice: string;
  tokenId: number;
  isBusy: boolean;
  onUpdate: (tokenId: number, newPrice: string) => Promise<boolean>;
}

export default function PriceEditor({ currentPrice, tokenId, isBusy, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentPrice);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    setValue(currentPrice);
    setError("");
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setValue(currentPrice);
    setError("");
  };

  const save = async () => {
    if (!value || isNaN(Number(value)) || Number(value) <= 0) {
      setError("Enter a valid price");
      return;
    }
    if (value === currentPrice) { setEditing(false); return; }
    setSaving(true);
    const ok = await onUpdate(tokenId, value);
    setSaving(false);
    if (ok) setEditing(false);
    else setError("Update failed");
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2 group">
        <span className="font-display text-2xl font-semibold text-violet-glow">{currentPrice} ETH</span>
        <button onClick={startEdit} disabled={isBusy}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-pearl-faint hover:text-violet-light disabled:pointer-events-none"
          style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}
          title="Edit price">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="font-mono text-xs text-pearl-faint uppercase tracking-wider">New Price (ETH)</p>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="number"
            min="0"
            step="0.001"
            value={value}
            onChange={e => { setValue(e.target.value); setError(""); }}
            onKeyDown={handleKey}
            className="w-full px-3 py-2.5 pr-12 rounded-xl font-mono text-sm text-pearl placeholder:text-pearl-faint focus:outline-none transition-all"
            style={{
              background: "rgba(22,22,46,0.9)",
              border: error ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(124,58,237,0.4)",
              boxShadow: error ? "0 0 0 2px rgba(239,68,68,0.1)" : "0 0 0 2px rgba(124,58,237,0.1)",
            }}
            placeholder={currentPrice}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-pearl-faint">ETH</span>
        </div>
        <button onClick={save} disabled={saving}
          className="p-2.5 rounded-xl text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#7C3AED,#06B6D4)" }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </button>
        <button onClick={cancel} disabled={saving}
          className="p-2.5 rounded-xl text-pearl-dim hover:text-pearl transition-colors"
          style={{ background: "rgba(22,22,46,0.8)", border: "1px solid rgba(82,82,128,0.3)" }}>
          <X className="w-4 h-4" />
        </button>
      </div>
      {error && <p className="font-sans text-xs text-red">{error}</p>}
      <p className="font-sans text-[11px] text-pearl-faint">Press Enter to save · Esc to cancel</p>
    </div>
  );
}
