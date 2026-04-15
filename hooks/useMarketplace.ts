"use client";
import { useState, useCallback } from "react";
import { ethers } from "ethers";
import type { TxState, Listing } from "@/types";
import { MARKETPLACE_ABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { parseError, txUrl, formatEth, calcFeeBreakdown } from "@/lib/utils";

const INIT: TxState = {status:"idle",hash:null,error:null,action:null};

export function useMarketplace(signer:ethers.JsonRpcSigner|null, chainId:number|null) {
  const [tx,setTx]           = useState<TxState>(INIT);
  const [explorerUrl,setExplorerUrl] = useState<string|null>(null);
  const [gasPreview,setGasPreview]   = useState<string|null>(null);
  const [feePercent,setFeePercent]   = useState<number>(200); 

  const getMarket = useCallback((r?:ethers.Signer|ethers.Provider)=>
    new ethers.Contract(CONTRACT_ADDRESSES.marketplace,MARKETPLACE_ABI,r??signer??undefined),[signer]);

  const reset = useCallback(()=>{setTx(INIT);setExplorerUrl(null);setGasPreview(null);},[]);

  // ── Fetch platform fee ──────────────────────────────────────────────────────
  const fetchPlatformFee = useCallback(async(provider:ethers.Provider)=>{
    try {
      const c=getMarket(provider);
      const fee=(await c.platformFee()) as bigint;
      setFeePercent(Number(fee));
    } catch {}
  },[getMarket]);

  // ── Fetch single listing ────────────────────────────────────────────────────
  const fetchListing = useCallback(async(provider:ethers.Provider,tokenId:number):Promise<Listing|null>=>{
    const c=getMarket(provider);
    try {
      const [seller,price,isActive]=(await c.listings(tokenId)) as [string,bigint,boolean];
      if (!isActive) return null;
      return {seller,price,priceEth:formatEth(price),isActive,tokenId};
    } catch { return null; }
  },[getMarket]);

  // ── Fetch all listings ──────────────────────────────────────────────────────
  const fetchAllListings = useCallback(async(provider:ethers.Provider):Promise<Map<number,Listing>>=>{
    const c=getMarket(provider);
    const max=CONTRACT_ADDRESSES.maxSupply;
    const results=await Promise.allSettled(Array.from({length:max},(_,i)=>c.listings(i+1) as Promise<[string,bigint,boolean]>));
    const map=new Map<number,Listing>();
    results.forEach((r,i)=>{
      if (r.status==="fulfilled"){
        const [seller,price,isActive]=r.value;
        if (isActive) map.set(i+1,{seller,price,priceEth:formatEth(price),isActive,tokenId:i+1});
      }
    });
    return map;
  },[getMarket]);

  // ── Gas estimate for buy ────────────────────────────────────────────────────
  const estimateBuyGas = useCallback(async(tokenId:number,priceWei:bigint):Promise<void>=>{
    if (!signer) return;
    try {
      const c=getMarket(signer);
      const gasUnits=await c.buyItem.estimateGas(tokenId,{value:priceWei});
      const fee=await signer.provider!.getFeeData();
      const gasPrice=fee.gasPrice??fee.maxFeePerGas??BigInt(0);
      setGasPreview(formatEth(gasUnits*gasPrice));
    } catch {}
  },[signer,getMarket]);

  // ── List ────────────────────────────────────────────────────────────────────
  const listItem = useCallback(async(tokenId:number,priceEth:string,isApprovedFn:(s:ethers.Signer,id:number)=>Promise<boolean>,approveFn:(s:ethers.Signer,id:number)=>Promise<string>):Promise<boolean>=>{
    if (!signer) return false;
    reset();
    try {
      if (!(await isApprovedFn(signer,tokenId))){
        setTx({status:"approving",hash:null,error:null,action:"approve"});
        await approveFn(signer,tokenId);
      }
      setTx({status:"pending",hash:null,error:null,action:"list"});
      const c=getMarket(signer);
      const res=await c.listItem(tokenId,ethers.parseEther(priceEth));
      setTx({status:"confirming",hash:res.hash,error:null,action:"list"});
      if (chainId) setExplorerUrl(txUrl(res.hash,chainId));
      await res.wait(1);
      setTx({status:"success",hash:res.hash,error:null,action:"list"});
      return true;
    } catch(e){setTx({status:"error",hash:null,error:parseError(e),action:"list"});return false;}
  },[signer,chainId,getMarket,reset]);

  // ── Buy ─────────────────────────────────────────────────────────────────────
  const buyItem = useCallback(async(tokenId:number,priceWei:bigint):Promise<boolean>=>{
    if (!signer) return false;
    reset();
    try {
      setTx({status:"pending",hash:null,error:null,action:"buy"});
      const c=getMarket(signer);
      const res=await c.buyItem(tokenId,{value:priceWei});
      setTx({status:"confirming",hash:res.hash,error:null,action:"buy"});
      if (chainId) setExplorerUrl(txUrl(res.hash,chainId));
      await res.wait(1);
      setTx({status:"success",hash:res.hash,error:null,action:"buy"});
      return true;
    } catch(e){setTx({status:"error",hash:null,error:parseError(e),action:"buy"});return false;}
  },[signer,chainId,getMarket,reset]);

  // ── Cancel ──────────────────────────────────────────────────────────────────
  const cancelListing = useCallback(async(tokenId:number):Promise<boolean>=>{
    if (!signer) return false;

    reset();

    
    try {
      setTx({status:"pending",hash:null,error:null,action:"cancel"});
      const c=getMarket(signer);
      const res=await c.cancelListing(tokenId);
      setTx({status:"confirming",hash:res.hash,error:null,action:"cancel"});
      if (chainId) setExplorerUrl(txUrl(res.hash,chainId));
      await res.wait(1);
      setTx({status:"success",hash:res.hash,error:null,action:"cancel"});
      return true;
    } catch(e){setTx({status:"error",hash:null,error:parseError(e),action:"cancel"});return false;}
  },[signer,chainId,getMarket,reset]);

  // ── Update listing (V3 NEW) ─────────────────────────────────────────────────
  const updateListing = useCallback(async(tokenId:number,newPriceEth:string):Promise<boolean>=>{
    if (!signer) return false;
    reset();
    try {
      setTx({status:"pending",hash:null,error:null,action:"update"});
      const c=getMarket(signer);
      const res=await c.updateListing(tokenId,ethers.parseEther(newPriceEth));
      setTx({status:"confirming",hash:res.hash,error:null,action:"update"});
      if (chainId) setExplorerUrl(txUrl(res.hash,chainId));
      await res.wait(1);
      setTx({status:"success",hash:res.hash,error:null,action:"update"});
      return true;
    } catch(e){setTx({status:"error",hash:null,error:parseError(e),action:"update"});return false;}
  },[signer,chainId,getMarket,reset]);

  const isBusy = tx.status==="approving"||tx.status==="pending"||tx.status==="confirming";

  return { tx,explorerUrl,gasPreview,isBusy,reset,feePercent,fetchPlatformFee,fetchListing,fetchAllListings,estimateBuyGas,listItem,buyItem,cancelListing,updateListing,calcFeeBreakdown:(priceWei:bigint)=>calcFeeBreakdown(priceWei,feePercent) };
}
