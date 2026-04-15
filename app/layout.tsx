import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArcMarket — V3 Marketplace",
  description: "Premium NFT trading platform with real-time analytics, seller earnings dashboard, and platform-level admin controls.",
  keywords: ["NFT", "marketplace", "V3", "premium", "Ethereum", "proceeds", "analytics"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="aurora-bg" />
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>
        <Toaster position="top-right" toastOptions={{
          duration: 5000,
          style: {
            background: "rgba(17,17,34,0.98)",
            color: "#F4F4FF",
            border: "1px solid rgba(124,58,237,0.2)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: "13px",
            borderRadius: "14px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6),0 0 0 1px rgba(124,58,237,0.1)",
          },
          success: { iconTheme: { primary: "#22C55E", secondary: "#08080E" } },
          error: { iconTheme: { primary: "#EF4444", secondary: "#08080E" } },
        }} />
      </body>
    </html>
  );
}
