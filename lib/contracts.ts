import type { ContractAddresses } from "@/types";

export const CONTRACT_ADDRESSES: ContractAddresses = {
  nft:         process.env.NEXT_PUBLIC_NFT_ADDRESS        || "0x0000000000000000000000000000000000000000",
  marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || "0x0000000000000000000000000000000000000000",
  chainId:     parseInt(process.env.NEXT_PUBLIC_CHAIN_ID   || "11155111"),
  chainName:   process.env.NEXT_PUBLIC_CHAIN_NAME          || "Sepolia Testnet",
  maxSupply:   parseInt(process.env.NEXT_PUBLIC_MAX_SUPPLY  || "10"),
};

export const NFT_ABI = [
  { inputs:[{internalType:"uint256",name:"tokenId",type:"uint256"}], name:"ownerOf", outputs:[{internalType:"address",name:"",type:"address"}], stateMutability:"view", type:"function" },
  { inputs:[{internalType:"uint256",name:"tokenId",type:"uint256"}], name:"tokenURI", outputs:[{internalType:"string",name:"",type:"string"}], stateMutability:"view", type:"function" },
  { inputs:[{internalType:"address",name:"to",type:"address"},{internalType:"uint256",name:"tokenId",type:"uint256"}], name:"approve", outputs:[], stateMutability:"nonpayable", type:"function" },
  { inputs:[{internalType:"uint256",name:"tokenId",type:"uint256"}], name:"getApproved", outputs:[{internalType:"address",name:"",type:"address"}], stateMutability:"view", type:"function" },
  { anonymous:false, inputs:[{indexed:true,internalType:"address",name:"from",type:"address"},{indexed:true,internalType:"address",name:"to",type:"address"},{indexed:true,internalType:"uint256",name:"tokenId",type:"uint256"}], name:"Transfer", type:"event" },
] as const;

export const MARKETPLACE_ABI = [
  // ── Read ────────────────────────────────────────────────────────────────────
  { inputs:[{internalType:"uint256",name:"tokenId",type:"uint256"}], name:"listings", outputs:[{internalType:"address",name:"seller",type:"address"},{internalType:"uint256",name:"price",type:"uint256"},{internalType:"bool",name:"isActive",type:"bool"}], stateMutability:"view", type:"function" },
  { inputs:[{internalType:"address",name:"seller",type:"address"}], name:"proceeds", outputs:[{internalType:"uint256",name:"",type:"uint256"}], stateMutability:"view", type:"function" },
  { inputs:[], name:"platformFee", outputs:[{internalType:"uint256",name:"",type:"uint256"}], stateMutability:"view", type:"function" },
  { inputs:[], name:"owner", outputs:[{internalType:"address",name:"",type:"address"}], stateMutability:"view", type:"function" },
  { inputs:[], name:"totalFeesCollected", outputs:[{internalType:"uint256",name:"",type:"uint256"}], stateMutability:"view", type:"function" },
  // ── Write ───────────────────────────────────────────────────────────────────
  { inputs:[{internalType:"uint256",name:"tokenId",type:"uint256"},{internalType:"uint256",name:"price",type:"uint256"}], name:"listItem",      outputs:[], stateMutability:"nonpayable", type:"function" },
  { inputs:[{internalType:"uint256",name:"tokenId",type:"uint256"}], name:"buyItem",       outputs:[], stateMutability:"payable",    type:"function" },
  { inputs:[{internalType:"uint256",name:"tokenId",type:"uint256"}], name:"cancelListing", outputs:[], stateMutability:"nonpayable", type:"function" },
  // V3 NEW: updateListing
  { inputs:[{internalType:"uint256",name:"tokenId",type:"uint256"},{internalType:"uint256",name:"newPrice",type:"uint256"}], name:"updateListing", outputs:[], stateMutability:"nonpayable", type:"function" },
  { inputs:[], name:"withdrawProceeds", outputs:[], stateMutability:"nonpayable", type:"function" },
  // V3 NEW: admin fee withdrawal
  { inputs:[], name:"withdrawFees", outputs:[], stateMutability:"nonpayable", type:"function" },
  // ── Events ──────────────────────────────────────────────────────────────────
  { anonymous:false, inputs:[{indexed:true,internalType:"address",name:"seller",type:"address"},{indexed:true,internalType:"uint256",name:"tokenId",type:"uint256"},{indexed:false,internalType:"uint256",name:"price",type:"uint256"}], name:"ItemListed",    type:"event" },
  { anonymous:false, inputs:[{indexed:true,internalType:"address",name:"buyer",type:"address"},{indexed:true,internalType:"uint256",name:"tokenId",type:"uint256"},{indexed:false,internalType:"uint256",name:"price",type:"uint256"}], name:"ItemBought",    type:"event" },
  { anonymous:false, inputs:[{indexed:true,internalType:"address",name:"seller",type:"address"},{indexed:true,internalType:"uint256",name:"tokenId",type:"uint256"}], name:"ItemCancelled", type:"event" },
  // V3 NEW: ItemUpdated event
  { anonymous:false, inputs:[{indexed:true,internalType:"address",name:"seller",type:"address"},{indexed:true,internalType:"uint256",name:"tokenId",type:"uint256"},{indexed:false,internalType:"uint256",name:"newPrice",type:"uint256"}], name:"ItemUpdated", type:"event" },
] as const;
