"use client";
import React from "react";

export function Spinner({ size="md",color="violet" }:{size?:"sm"|"md"|"lg";color?:"violet"|"cyan"|"white"}) {
  const s={sm:"w-4 h-4 border-[1.5px]",md:"w-6 h-6 border-2",lg:"w-10 h-10 border-[2.5px]"}[size];
  const c={violet:"border-violet-pale border-t-violet",cyan:"border-cyan-pale border-t-cyan",white:"border-white/20 border-t-white"}[color];
  return <div className={`${s} ${c} rounded-full animate-spin`} />;
}

export function Skeleton({className=""}:{className?:string}) {
  return (
    <div className={`rounded-xl overflow-hidden ${className}`}
      style={{background:"linear-gradient(90deg,rgba(22,22,46,0.8) 0%,rgba(30,30,63,0.9) 50%,rgba(22,22,46,0.8) 100%)",backgroundSize:"600px 100%",animation:"shimmer 2s ease-in-out infinite"}} />
  );
}

export function NFTCardSkeleton() {
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{background:"linear-gradient(135deg,rgba(22,22,46,0.9) 0%,rgba(13,13,24,0.95) 100%)",border:"1px solid rgba(124,58,237,0.1)"}}>
      <Skeleton className="aspect-square" />
      <div className="p-4 space-y-2.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-9 w-full mt-2 rounded-xl" />
      </div>
    </div>
  );
}

export default function Loader({text}:{text?:string}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" />
      {text && <p className="font-sans text-sm text-pearl-dim animate-pulse">{text}</p>}
    </div>
  );
}
