"use client";
import { useState, useCallback } from "react";
import { ethers } from "ethers";
import type { NFTItem, NFTMetadata } from "@/types";
import { NFT_ABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { resolveIpfs, fetchMeta } from "@/lib/utils";

export function useNFTs() {
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const getContract = useCallback((r:ethers.Provider|ethers.Signer)=>new ethers.Contract(CONTRACT_ADDRESSES.nft,NFT_ABI,r),[]);

  const fetchNFTs = useCallback(async(provider:ethers.Provider)=>{
    setIsLoading(true);

    const contract = getContract(provider);
    
    const max = CONTRACT_ADDRESSES.maxSupply;
    setNfts(Array.from({length:max},(_,i)=>({tokenId:i+1,owner:null,tokenUri:null,metadata:null,imageUrl:null,listing:null,isLoadingMeta:true})));
    const [ownerRes,uriRes] = await Promise.all([
      Promise.allSettled(Array.from({length:max},(_,i)=>contract.ownerOf(i+1) as Promise<string>)),
      Promise.allSettled(Array.from({length:max},(_,i)=>contract.tokenURI(i+1) as Promise<string>)),
    ]);
    const base:NFTItem[] = Array.from({length:max},(_,i)=>({
      tokenId:i+1,
      owner:ownerRes[i].status==="fulfilled"?ownerRes[i].value:null,
      tokenUri:uriRes[i].status==="fulfilled"?uriRes[i].value:null,
      metadata:null,imageUrl:null,listing:null,isLoadingMeta:true,
    }));
    setNfts(base);
    setIsLoading(false);
    // Lazy metadata
    for (let i=0;i<max;i++) {
      const uri=base[i].tokenUri;
      if (!uri){setNfts(p=>p.map(n=>n.tokenId===i+1?{...n,isLoadingMeta:false}:n));continue;}
      fetchMeta(uri).then(m=>{
        const meta=m as NFTMetadata|null;
        const imageUrl=meta?.image?resolveIpfs(meta.image):null;
        setNfts(p=>p.map(n=>n.tokenId===i+1?{...n,metadata:meta,imageUrl,isLoadingMeta:false}:n));
      }).catch(()=>setNfts(p=>p.map(n=>n.tokenId===i+1?{...n,isLoadingMeta:false}:n)));
    }
  },[getContract]);

  const isApproved = useCallback(async(signer:ethers.Signer,tokenId:number):Promise<boolean>=>{
    const c=getContract(signer);
    try{return ((await c.getApproved(tokenId))as string).toLowerCase()===CONTRACT_ADDRESSES.marketplace.toLowerCase();}catch{return false;}
  },[getContract]);

  const approveMarketplace = useCallback(async(signer:ethers.Signer,tokenId:number):Promise<string>=>{
    const c=getContract(signer);
    const tx=await c.approve(CONTRACT_ADDRESSES.marketplace,tokenId);
    await tx.wait(1);return tx.hash;
  },[getContract]);

  return {nfts,setNfts,isLoading,fetchNFTs,isApproved,approveMarketplace};
}
