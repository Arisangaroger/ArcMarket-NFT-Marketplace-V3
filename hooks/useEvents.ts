"use client";
import { useState, useCallback } from "react";
import { ethers } from "ethers";
import type { ActivityEvent, ActivityType } from "@/types";
import { MARKETPLACE_ABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { formatEth } from "@/lib/utils";

const LOOK_BACK = 10_000;

export function useEvents() {
  const [events,setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading,setIsLoading] = useState(false);

  const getContract = useCallback((p:ethers.Provider)=>new ethers.Contract(CONTRACT_ADDRESSES.marketplace,MARKETPLACE_ABI,p),[]);

  const fetchEvents = useCallback(async(provider:ethers.Provider)=>{
    setIsLoading(true);
    try {
      const contract=getContract(provider);
      const latest=await provider.getBlockNumber();
      const from=Math.max(0,latest-LOOK_BACK);
      const [listeds,boughts,cancels,updates]=await Promise.allSettled([
        contract.queryFilter(contract.filters.ItemListed?.(),   from,latest) as Promise<ethers.EventLog[]>,
        contract.queryFilter(contract.filters.ItemBought?.(),   from,latest) as Promise<ethers.EventLog[]>,
        contract.queryFilter(contract.filters.ItemCancelled?.(),from,latest) as Promise<ethers.EventLog[]>,
        contract.queryFilter(contract.filters.ItemUpdated?.(),  from,latest) as Promise<ethers.EventLog[]>,
      ]);
      const raw:ActivityEvent[]=[];
      const process=(result:PromiseSettledResult<ethers.EventLog[]>,type:ActivityType)=>{
        if (result.status!=="fulfilled") return;
        result.value.forEach(log=>{
          try {
            const parsed=contract.interface.parseLog(log);
            if (!parsed) return;
            const base={id:`${log.transactionHash}-${log.index}`,type,txHash:log.transactionHash,blockNumber:log.blockNumber,timestamp:null};
            if (type==="listed")    raw.push({...base,tokenId:Number(parsed.args.tokenId),seller:parsed.args.seller as string,price:parsed.args.price as bigint,priceEth:formatEth(parsed.args.price as bigint)});
            else if (type==="sold") raw.push({...base,tokenId:Number(parsed.args.tokenId),buyer:parsed.args.buyer as string,price:parsed.args.price as bigint,priceEth:formatEth(parsed.args.price as bigint)});
            else if (type==="cancelled") raw.push({...base,tokenId:Number(parsed.args.tokenId),seller:parsed.args.seller as string});
            else if (type==="updated")   raw.push({...base,tokenId:Number(parsed.args.tokenId),seller:parsed.args.seller as string,price:parsed.args.newPrice as bigint,priceEth:formatEth(parsed.args.newPrice as bigint)});
          } catch {}
        });
      };
      process(listeds,"listed");process(boughts,"sold");process(cancels,"cancelled");process(updates,"updated");
      raw.sort((a,b)=>b.blockNumber-a.blockNumber);
      setEvents(raw);
      // Enrich top 20 with timestamps
      const top=raw.slice(0,20);
      const blocks=await Promise.allSettled(top.map(e=>provider.getBlock(e.blockNumber)));
      setEvents(prev=>{
        const ts=new Map<string,number>();
        blocks.forEach((r,i)=>{if(r.status==="fulfilled"&&r.value)ts.set(top[i].id,r.value.timestamp);});
        return prev.map(e=>ts.has(e.id)?{...e,timestamp:ts.get(e.id)!}:e);
      });
    } catch(err){console.error("fetchEvents:",err);}
    finally{setIsLoading(false);}
  },[getContract]);

  const subscribeEvents = useCallback((provider:ethers.Provider,onNew:(e:ActivityEvent)=>void)=>{
    const contract=getContract(provider);
    const ts=()=>Math.floor(Date.now()/1000);
    const mkEvent=(type:ActivityType,hash:string,blockNum:number)=>({type,txHash:hash,blockNumber:blockNum,timestamp:ts()});

    const onListed=(seller:string,tokenId:bigint,price:bigint,log:ethers.EventLog)=>{
      onNew({id:`${log.transactionHash}-${log.index}`,...mkEvent("listed",log.transactionHash,log.blockNumber),tokenId:Number(tokenId),seller,price,priceEth:formatEth(price)});
    };
    const onBought=(buyer:string,tokenId:bigint,price:bigint,log:ethers.EventLog)=>{
      onNew({id:`${log.transactionHash}-${log.index}`,...mkEvent("sold",log.transactionHash,log.blockNumber),tokenId:Number(tokenId),buyer,price,priceEth:formatEth(price)});
    };
    const onCancelled=(seller:string,tokenId:bigint,log:ethers.EventLog)=>{
      onNew({id:`${log.transactionHash}-${log.index}`,...mkEvent("cancelled",log.transactionHash,log.blockNumber),tokenId:Number(tokenId),seller});
    };
    const onUpdated=(seller:string,tokenId:bigint,newPrice:bigint,log:ethers.EventLog)=>{
      onNew({id:`${log.transactionHash}-${log.index}`,...mkEvent("updated",log.transactionHash,log.blockNumber),tokenId:Number(tokenId),seller,price:newPrice,priceEth:formatEth(newPrice)});
    };

    try {
      contract.on("ItemListed",onListed);contract.on("ItemBought",onBought);
      contract.on("ItemCancelled",onCancelled);contract.on("ItemUpdated",onUpdated);
    } catch {}

    return ()=>{
      try { contract.off("ItemListed",onListed);contract.off("ItemBought",onBought);contract.off("ItemCancelled",onCancelled);contract.off("ItemUpdated",onUpdated); } catch {}
    };
  },[getContract]);

  return {events,setEvents,isLoading,fetchEvents,subscribeEvents};
}
