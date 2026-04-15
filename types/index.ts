// ─── Wallet ───────────────────────────────────────────────────────────────────
export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  error: string | null;
}

// ─── NFT ─────────────────────────────────────────────────────────────────────
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}

export interface NFTItem {
  tokenId: number;
  owner: string | null;
  tokenUri: string | null;
  metadata: NFTMetadata | null;
  imageUrl: string | null;
  listing: Listing | null;
  isLoadingMeta: boolean;
}

// ─── Listing ──────────────────────────────────────────────────────────────────
export interface Listing {
  seller: string;
  price: bigint;
  priceEth: string;
  isActive: boolean;
  tokenId: number;
}

// ─── Proceeds ─────────────────────────────────────────────────────────────────
export interface ProceedsState {
  amount: bigint;
  amountEth: string;
  isLoading: boolean;
}

// ─── Transaction ──────────────────────────────────────────────────────────────
export type TxStatus = "idle" | "approving" | "pending" | "confirming" | "success" | "error";

export interface TxState {
  status: TxStatus;
  hash: string | null;
  error: string | null;
  action: "list" | "buy" | "cancel" | "update" | "approve" | "withdraw" | "withdrawFees" | null;
}

// ─── Activity / Events ────────────────────────────────────────────────────────
export type ActivityType = "listed" | "sold" | "cancelled" | "updated";

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  tokenId: number;
  seller?: string;
  buyer?: string;
  price?: bigint;
  priceEth?: string;
  oldPrice?: bigint;
  txHash: string;
  blockNumber: number;
  timestamp: number | null;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export type NotificationType = "sale" | "listing" | "cancel" | "update" | "withdraw" | "error";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  txHash?: string;
}

// ─── Filters ──────────────────────────────────────────────────────────────────
export interface MarketFilters {
  status: "all" | "listed" | "unlisted";
  minPrice: string;
  maxPrice: string;
  search: string;
  sortBy: "id_asc" | "id_desc" | "price_asc" | "price_desc";
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export interface AdminStats {
  totalSales: number;
  totalVolume: string;
  totalFees: string;
  platformBalance: bigint;
  platformBalanceEth: string;
  isLoading: boolean;
}

// ─── Contract Config ──────────────────────────────────────────────────────────
export interface ContractAddresses {
  nft: string;
  marketplace: string;
  chainId: number;
  chainName: string;
  maxSupply: number;
}
