# ArcMarket — V3 Premium Marketplace

A production-grade NFT marketplace V3 with **persistent sidebar layout**, **inline price editing**, **full fee transparency**, **admin panel**, **real-time event subscriptions**, and **platform-level analytics**.

---

## 🎨 Design System (Unique to V3)

| Token | Value |
|---|---|
| Base | `#08080E` deep space |
| Accent 1 | `#7C3AED` electric violet |
| Accent 2 | `#06B6D4` electric cyan |
| Text | `#F4F4FF` cool pearl |
| Success | `#22C55E` green |
| Font (Display) | **Sora** — geometric sans |
| Font (Body) | **DM Sans** |
| Font (Mono) | **Space Mono** |
| Layout | **Persistent left sidebar** (unique vs V1/V2) |
| Effects | Aurora radial glow, glass morphism, ripple clicks |

---

## ✨ V3 Features (All Implemented)

### Core Marketplace
- Hero stats bar: Total NFTs, Listed count, Floor Price, Volume Traded
- NFT Grid with Quick Buy ⚡ hover overlay + View Details 👁️
- Card hover: scale + border glow + image zoom
- Button ripple click effect

### NFT Detail Page
- Left image / Right actions split layout
- **Inline price editing** — click price → edit → save (no modal)
- Full fee breakdown: NFT Price / Platform Fee / Seller Receives
- Dynamic action buttons: Buy (non-owner listed) / Update+Cancel (seller) / List (owner unlisted)
- Real-time update after every action

### User Dashboard
- My NFTs tab — owned with List button
- My Listings tab — active listings with inline PriceEditor + Cancel
- Earnings tab — proceeds balance + Withdraw button + sales history
- Proceeds alert banner when ETH is claimable

### Admin Panel (`/admin`)
- Owner-only access (3-layer guard: no wallet → wrong network → not owner)
- Platform balance + Withdraw Fees button
- Analytics: Total Sales, Total Volume, Fees Earned
- Bar chart of recent sale volumes (recharts)

### V3 Advanced Features
- Event subscriptions: ItemListed, ItemBought, ItemCancelled, **ItemUpdated**
- In-app notification system with bell icon + unread count
- Sidebar proceeds alert + auto-routing to earnings
- Real-time activity feed (right sidebar on marketplace)
- Fee transparency everywhere

---

## 📁 Structure

```
nft-marketplace-v3/
├── app/
│   ├── globals.css          # Aurora design system, Sora+DM Sans+Space Mono
│   ├── layout.tsx           # Aurora BG overlay
│   ├── page.tsx             # Marketplace (hero stats + grid + activity feed)
│   ├── nft/[id]/page.tsx    # Detail (inline edit + fee breakdown)
│   ├── profile/page.tsx     # Dashboard (NFTs / Listings / Earnings)
│   └── admin/page.tsx       # Admin panel (access-guarded)
│
├── components/
│   ├── Sidebar.tsx          # Persistent left sidebar (collapsible) + MobileTopbar
│   ├── NFTCard.tsx          # Glass card, Quick Buy overlay, ripple effect, fee badge
│   ├── MarketplaceGrid.tsx  # Filtered grid with inline filter bar
│   ├── PriceEditor.tsx      # Inline click-to-edit price with Enter/Esc
│   ├── BuyPanel.tsx         # Buy modal with full fee breakdown
│   ├── WithdrawPanel.tsx    # Earnings withdraw with green highlight
│   ├── AdminStats.tsx       # Platform analytics + recharts bar chart
│   ├── ListModal.tsx        # List NFT with approval flow
│   ├── NotificationBell.tsx # Bell icon + notification drawer
│   └── Loader.tsx           # Glass skeleton loaders
│
├── hooks/
│   ├── useWallet.ts         # MetaMask, auto-reconnect, events
│   ├── useNFTs.ts           # Ownership + metadata + approval
│   ├── useMarketplace.ts    # list, buy, cancel, update, gas, fee%, listings
│   ├── useEvents.ts         # queryFilter + subscribeEvents (all 4 event types)
│   ├── useProceeds.ts       # proceeds() + withdrawProceeds()
│   └── useAdmin.ts          # owner check + platform stats + withdrawFees
│
├── lib/
│   ├── contracts.ts         # V3 ABIs (updateListing, withdrawFees, platformFee)
│   ├── utils.ts             # calcFeeBreakdown, formatEth, parseError, etc.
│   └── notifications.ts     # Client-side notification store (pub/sub)
│
└── types/index.ts           # All types incl. Notification, AdminStats
```

---

## 🚀 Setup

```bash
npm install
cp .env.local.example .env.local
# Fill in contract addresses
npm run dev
```

---

## 🔌 V3 Contract Requirements

| Function | Type | What's New |
|---|---|---|
| `listings(tokenId)` | Read | Same as V2 |
| `proceeds(address)` | Read | Same as V2 |
| `platformFee()` | Read | **V3 NEW** — returns fee in basis points (e.g. 200 = 2%) |
| `owner()` | Read | **V3 NEW** — for admin access check |
| `totalFeesCollected()` | Read | **V3 NEW** — admin analytics |
| `listItem()` | Write | Same |
| `buyItem()` | Write payable | Same |
| `cancelListing()` | Write | Same |
| `updateListing(tokenId, newPrice)` | Write | **V3 NEW** |
| `withdrawProceeds()` | Write | Same as V2 |
| `withdrawFees()` | Write | **V3 NEW** — owner only |
| `ItemListed` | Event | Same |
| `ItemBought` | Event | Same |
| `ItemCancelled` | Event | Same |
| `ItemUpdated(seller, tokenId, newPrice)` | Event | **V3 NEW** |
