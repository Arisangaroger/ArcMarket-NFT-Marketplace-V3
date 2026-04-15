import { ethers } from "ethers";

// ─── IPFS ─────────────────────────────────────────────────────────────────────
const GATEWAYS = ["https://ipfs.io/ipfs/","https://cloudflare-ipfs.com/ipfs/","https://gateway.pinata.cloud/ipfs/"];
export function resolveIpfs(uri: string, idx = 0): string {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) return `${GATEWAYS[idx]??GATEWAYS[0]}${uri.slice(7)}`;
  return uri;
}

// ─── ETH ──────────────────────────────────────────────────────────────────────
export function formatEth(wei: bigint|string): string {
  try {
    const v = parseFloat(ethers.formatEther(wei.toString()));
    if (v===0) return "0";
    if (v<0.0001) return v.toFixed(6);
    if (v<1) return v.toFixed(4);
    return v.toFixed(3);
  } catch { return "0"; }
}
export function parseEth(eth: string): bigint {
  try { return ethers.parseEther(eth); } catch { return BigInt(0); }
}
export function truncateAddr(a: string, chars=4): string {
  if (!a) return "";
  return `${a.slice(0,chars+2)}…${a.slice(-chars)}`;
}

// ─── Fee calculation ──────────────────────────────────────────────────────────
export function calcFeeBreakdown(priceWei: bigint, feePercent: number) {
  // feePercent e.g. 200 = 2%
  const feeWei = (priceWei * BigInt(feePercent)) / BigInt(10000);
  const sellerReceives = priceWei - feeWei;
  return {
    price:           priceWei,
    priceEth:        formatEth(priceWei),
    fee:             feeWei,
    feeEth:          formatEth(feeWei),
    feePercent:      feePercent / 100,
    sellerReceives,
    sellerReceivesEth: formatEth(sellerReceives),
  };
}

// ─── Network ──────────────────────────────────────────────────────────────────
export const CHAIN_NAMES: Record<number,string> = { 1:"Ethereum",11155111:"Sepolia",5:"Goerli",137:"Polygon",80001:"Mumbai" };
export const getChainName = (id: number) => CHAIN_NAMES[id]??`Chain ${id}`;
export function txUrl(hash: string, chainId: number): string {
  const m: Record<number,string> = { 1:"https://etherscan.io/tx/",11155111:"https://sepolia.etherscan.io/tx/",5:"https://goerli.etherscan.io/tx/",137:"https://polygonscan.com/tx/",80001:"https://mumbai.polygonscan.com/tx/" };
  return `${m[chainId]??"https://etherscan.io/tx/"}${hash}`;
}
export function addrUrl(address: string, chainId: number): string {
  const m: Record<number,string> = { 1:"https://etherscan.io/address/",11155111:"https://sepolia.etherscan.io/address/",5:"https://goerli.etherscan.io/address/",137:"https://polygonscan.com/address/",80001:"https://mumbai.polygonscan.com/address/" };
  return `${m[chainId]??"https://etherscan.io/address/"}${address}`;
}

// ─── Error parsing ────────────────────────────────────────────────────────────
export function parseError(err: unknown): string {
  if (!err) return "Unknown error.";
  const e = err as { code?:string|number; reason?:string; message?:string; data?:{message?:string} };
  if (e.code===4001||e.code==="ACTION_REJECTED"||e.message?.includes("user rejected")) return "Transaction cancelled.";
  if (e.reason) return e.reason;
  if (e.data?.message) return e.data.message;
  const msg = e.message??"";
  if (msg.includes("not listed")||msg.includes("not active")) return "NFT is not listed for sale.";
  if (msg.includes("not the seller"))  return "Only the seller can do this.";
  if (msg.includes("insufficient"))    return "Insufficient ETH in wallet.";
  if (msg.includes("no proceeds"))     return "No proceeds to withdraw.";
  if (msg.includes("not owner"))       return "Only the contract owner can do this.";
  if (msg.length>120) return msg.slice(0,120)+"…";
  return msg||"Transaction failed.";
}

// ─── Metadata cache ───────────────────────────────────────────────────────────
const cache = new Map<string,object>();
export async function fetchMeta(uri: string): Promise<object|null> {
  const url = resolveIpfs(uri);
  if (!url) return null;
  if (cache.has(url)) return cache.get(url)!;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const d = await r.json();
    cache.set(url,d);
    return d;
  } catch { return null; }
}

// ─── Time ─────────────────────────────────────────────────────────────────────
export function timeAgo(ts: number): string {
  const d = Math.floor((Date.now()/1000)-ts);
  if (d<60) return `${d}s ago`;
  if (d<3600) return `${Math.floor(d/60)}m ago`;
  if (d<86400) return `${Math.floor(d/3600)}h ago`;
  return `${Math.floor(d/86400)}d ago`;
}

export function sleep(ms: number) { return new Promise(r=>setTimeout(r,ms)); }

// ─── Unique ID ────────────────────────────────────────────────────────────────
export function uid(): string { return Math.random().toString(36).slice(2); }
