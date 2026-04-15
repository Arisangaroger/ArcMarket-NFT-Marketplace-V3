"use client";
import { useState, useCallback } from "react";
import { ethers } from "ethers";
import type { ProceedsState, TxState } from "@/types";
import { MARKETPLACE_ABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { formatEth, parseError, txUrl } from "@/lib/utils";

const INIT_P: ProceedsState = {amount:BigInt(0),amountEth:"0",isLoading:false};
const INIT_TX: TxState = {status:"idle",hash:null,error:null,action:null};

export function useProceeds(signer:ethers.JsonRpcSigner|null, chainId:number|null) {
  const [proceeds,setProceeds] = useState<ProceedsState>(INIT_P);
  const [withdrawTx,setWithdrawTx] = useState<TxState>(INIT_TX);
  const [explorerUrl,setExplorerUrl] = useState<string|null>(null);

  const getContract = useCallback((r:ethers.Provider|ethers.Signer)=>new ethers.Contract(CONTRACT_ADDRESSES.marketplace,MARKETPLACE_ABI,r),[]);

  const fetchProceeds = useCallback(async(provider:ethers.Provider,address:string)=>{
    setProceeds(p=>({...p,isLoading:true}));
    try {
      const c=getContract(provider);
      const amount=(await c.proceeds(address)) as bigint;
      setProceeds({amount,amountEth:formatEth(amount),isLoading:false});
    } catch { setProceeds(p=>({...p,isLoading:false})); }
  },[getContract]);

  const withdrawProceeds = useCallback(async():Promise<boolean>=>{
    if (!signer) return false;
    setWithdrawTx({status:"pending",hash:null,error:null,action:"withdraw"});
    try {
      const c=getContract(signer);
      const tx=await c.withdrawProceeds();
      setWithdrawTx({status:"confirming",hash:tx.hash,error:null,action:"withdraw"});
      if (chainId) setExplorerUrl(txUrl(tx.hash,chainId));
      await tx.wait(1);
      setWithdrawTx({status:"success",hash:tx.hash,error:null,action:"withdraw"});
      setProceeds({amount:BigInt(0),amountEth:"0",isLoading:false});
      return true;
    } catch(e){setWithdrawTx({status:"error",hash:null,error:parseError(e),action:"withdraw"});return false;}
  },[signer,chainId,getContract]);

  const resetTx = useCallback(()=>{setWithdrawTx(INIT_TX);setExplorerUrl(null);},[]);

  return { proceeds,fetchProceeds,withdrawProceeds,withdrawTx,explorerUrl,resetTx,isBusy:withdrawTx.status==="pending"||withdrawTx.status==="confirming",hasProceeds:proceeds.amount>BigInt(0) };
}
