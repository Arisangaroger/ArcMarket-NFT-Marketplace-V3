"use client";
import { useState, useCallback } from "react";
import { ethers } from "ethers";
import type { AdminStats, TxState } from "@/types";
import { MARKETPLACE_ABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { formatEth, parseError, txUrl } from "@/lib/utils";
import type { ActivityEvent } from "@/types";

const INIT_STATS: AdminStats = {totalSales:0,totalVolume:"0",totalFees:"0",platformBalance:BigInt(0),platformBalanceEth:"0",isLoading:false};
const INIT_TX: TxState = {status:"idle",hash:null,error:null,action:null};

export function useAdmin(signer:ethers.JsonRpcSigner|null, chainId:number|null) {
  const [stats,setStats]       = useState<AdminStats>(INIT_STATS);
  const [isOwner,setIsOwner]   = useState(false);
  const [withdrawTx,setWithdrawTx] = useState<TxState>(INIT_TX);
  const [explorerUrl,setExplorerUrl] = useState<string|null>(null);

  const getContract = useCallback((r:ethers.Provider|ethers.Signer)=>new ethers.Contract(CONTRACT_ADDRESSES.marketplace,MARKETPLACE_ABI,r),[]);

  // Check if connected wallet is owner
  const checkOwner = useCallback(async(provider:ethers.Provider,address:string)=>{
    try {
      const c=getContract(provider);
      const owner=(await c.owner()) as string;
      setIsOwner(owner.toLowerCase()===address.toLowerCase());
    } catch { setIsOwner(false); }
  },[getContract]);

  // Fetch platform stats: balance + fees collected from contract
  const fetchAdminStats = useCallback(async(provider:ethers.Provider,events:ActivityEvent[])=>{
    setStats(s=>({...s,isLoading:true}));
    try {
      const c=getContract(provider);
      let platformBalance=BigInt(0);
      let totalFeesCollected=BigInt(0);
      try { platformBalance=BigInt((await provider.getBalance(CONTRACT_ADDRESSES.marketplace)).toString()); } catch {}
      try { totalFeesCollected=(await c.totalFeesCollected()) as bigint; } catch {}

      // Derive analytics from events
      const sales = events.filter(e=>e.type==="sold");
      const totalVolumeWei = sales.reduce((sum,e)=>sum+(e.price??BigInt(0)),BigInt(0));

      setStats({
        totalSales: sales.length,
        totalVolume: formatEth(totalVolumeWei),
        totalFees: formatEth(totalFeesCollected),
        platformBalance,
        platformBalanceEth: formatEth(platformBalance),
        isLoading: false,
      });
    } catch { setStats(s=>({...s,isLoading:false})); }
  },[getContract]);

  // Admin withdraw fees
  const withdrawFees = useCallback(async():Promise<boolean>=>{
    if (!signer) return false;
    setWithdrawTx({status:"pending",hash:null,error:null,action:"withdrawFees"});
    try {
      const c=getContract(signer);
      const tx=await c.withdrawFees();
      setWithdrawTx({status:"confirming",hash:tx.hash,error:null,action:"withdrawFees"});
      if (chainId) setExplorerUrl(txUrl(tx.hash,chainId));
      await tx.wait(1);
      setWithdrawTx({status:"success",hash:tx.hash,error:null,action:"withdrawFees"});
      setStats(s=>({...s,platformBalance:BigInt(0),platformBalanceEth:"0"}));
      return true;
    } catch(e){setWithdrawTx({status:"error",hash:null,error:parseError(e),action:"withdrawFees"});return false;}
  },[signer,chainId,getContract]);

  const resetTx = useCallback(()=>{setWithdrawTx(INIT_TX);setExplorerUrl(null);},[]);
  const isBusy = withdrawTx.status==="pending"||withdrawTx.status==="confirming";

  return {stats,isOwner,withdrawTx,explorerUrl,isBusy,checkOwner,fetchAdminStats,withdrawFees,resetTx};
}
