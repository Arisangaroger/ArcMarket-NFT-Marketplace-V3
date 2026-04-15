"use client";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import type { WalletState } from "@/types";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import { getChainName } from "@/lib/utils";

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider & {
      on:(e:string,h:(...a:unknown[])=>void)=>void;
      removeListener:(e:string,h:(...a:unknown[])=>void)=>void;
      request:(a:{method:string;params?:unknown[]})=>Promise<unknown>;
    };
  }
}

const INIT: WalletState = { address:null,isConnected:false,isConnecting:false,chainId:null,error:null };

export function useWallet() {
  const [wallet, setWallet]   = useState<WalletState>(INIT);
  const [provider, setProvider] = useState<ethers.BrowserProvider|null>(null);
  const [signer,   setSigner]   = useState<ethers.JsonRpcSigner|null>(null);
  const isCorrectNetwork = wallet.chainId === CONTRACT_ADDRESSES.chainId;

  const connect = useCallback(async () => {
    if (!window.ethereum) { setWallet(s=>({...s,error:"MetaMask not found."})); return; }
    setWallet(s=>({...s,isConnecting:true,error:null}));
    try {
      const p = new ethers.BrowserProvider(window.ethereum);
      await p.send("eth_requestAccounts",[]);
      const s = await p.getSigner();
      const address = await s.getAddress();
      const {chainId} = await p.getNetwork();
      setProvider(p); setSigner(s);
      setWallet({address,isConnected:true,isConnecting:false,chainId:Number(chainId),error:null});
    } catch(e:unknown) {
      const err=e as {code?:number;message?:string};
      setWallet(s=>({...s,isConnecting:false,error:err.code===4001?"Rejected.":(err.message??"Failed.")}));
    }
  },[]);

  const disconnect = useCallback(()=>{setWallet(INIT);setProvider(null);setSigner(null);},[]);

  const switchNetwork = useCallback(async()=>{
    if (!window.ethereum) return;
    try { await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:`0x${CONTRACT_ADDRESSES.chainId.toString(16)}`}]}); } catch {}
  },[]);

  useEffect(()=>{
    if (!window.ethereum) return;
    (async()=>{
      try {
        const p = new ethers.BrowserProvider(window.ethereum!);
        const accs=(await p.send("eth_accounts",[]))as string[];
        if (!accs.length) return;
        const s=await p.getSigner(); const address=await s.getAddress(); const {chainId}=await p.getNetwork();
        setProvider(p);setSigner(s);setWallet({address,isConnected:true,isConnecting:false,chainId:Number(chainId),error:null});
      } catch {}
    })();
  },[]);

  useEffect(()=>{
    if (!window.ethereum) return;
    const onAccs=(a:unknown)=>{const accs=a as string[];if(!accs.length)disconnect();else setWallet(s=>({...s,address:accs[0]}));};
    const onChain=(c:unknown)=>{
      setWallet(s=>({...s,chainId:parseInt(c as string,16)}));
      if (window.ethereum){const p=new ethers.BrowserProvider(window.ethereum);setProvider(p);p.getSigner().then(setSigner).catch(()=>{});}
    };
    window.ethereum.on("accountsChanged",onAccs);
    window.ethereum.on("chainChanged",onChain);
    return ()=>{window.ethereum?.removeListener("accountsChanged",onAccs);window.ethereum?.removeListener("chainChanged",onChain);};
  },[disconnect]);

  return { wallet,provider,signer,connect,disconnect,switchNetwork,isCorrectNetwork,chainName:wallet.chainId?getChainName(wallet.chainId):null,targetChainName:CONTRACT_ADDRESSES.chainName };
}
