import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep space base
        space: {
          DEFAULT: "#08080E",
          50: "#0D0D18",
          100: "#111122",
          200: "#16162E",
          300: "#1E1E3F",
          400: "#28285A",
          500: "#35357A",
        },
        // Text scale
        pearl: {
          DEFAULT: "#F4F4FF",
          dim: "#A0A0C8",
          faint: "#525280",
          ghost: "#2A2A50",
        },
        // Primary accent — electric violet
        violet: {
          DEFAULT: "#7C3AED",
          bright: "#9333EA",
          light: "#A855F7",
          pale: "#1A0D35",
          mid: "#2D1A5A",
          glow: "#C084FC",
        },
        // Secondary accent — electric cyan
        cyan: {
          DEFAULT: "#06B6D4",
          bright: "#22D3EE",
          light: "#67E8F9",
          pale: "#061A20",
          mid: "#0E3040",
          glow: "#A5F3FC",
        },
        // Status
        green: {
          DEFAULT: "#22C55E",
          pale: "#052010",
          mid: "#0D3A1A",
          bright: "#4ADE80",
        },
        amber: {
          DEFAULT: "#F59E0B",
          pale: "#1A1000",
          bright: "#FBD34D",
        },
        red: {
          DEFAULT: "#EF4444",
          pale: "#200808",
          bright: "#F87171",
        },
      },

      fontFamily: {
        display: ["var(--font-sora)", "sans-serif"],
        sans: ["var(--font-dm)", "system-ui", "sans-serif"],
        mono: ["var(--font-space)", "monospace"],
      },

      boxShadow: {
        glass:       "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        "glass-lg":  "0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
        violet:      "0 0 24px rgba(124,58,237,0.3), 0 0 60px rgba(124,58,237,0.1)",
        "violet-lg": "0 0 40px rgba(124,58,237,0.4), 0 0 80px rgba(124,58,237,0.15)",
        cyan:        "0 0 24px rgba(6,182,212,0.3), 0 0 60px rgba(6,182,212,0.1)",
        "cyan-sm":   "0 0 12px rgba(6,182,212,0.25)",
        modal:       "0 32px 80px rgba(0,0,0,0.8), 0 4px 20px rgba(0,0,0,0.6)",
        card:        "0 2px 8px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.3)",
        "card-hover":"0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.3)",
      },

      backgroundImage: {
        "aurora":         "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.15) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 50%, rgba(6,182,212,0.1) 0%, transparent 60%)",
        "card-gradient":  "linear-gradient(135deg, rgba(22,22,46,0.9) 0%, rgba(13,13,24,0.95) 100%)",
        "violet-gradient":"linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)",
        "cyan-gradient":  "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)",
        "dual-gradient":  "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)",
        "sidebar-gradient":"linear-gradient(180deg, #0D0D18 0%, #0A0A15 100%)",
      },

      animation: {
        "fade-up":   "fadeUp 0.5s ease-out forwards",
        "fade-in":   "fadeIn 0.3s ease-out forwards",
        "slide-in":  "slideIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards",
        "slide-up":  "slideUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards",
        "shimmer":   "shimmer 2s ease-in-out infinite",
        "glow-pulse":"glowPulse 2s ease-in-out infinite",
        "bounce-in": "bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "ripple":    "ripple 0.6s ease-out forwards",
        "float":     "float 3s ease-in-out infinite",
        "scale-in":  "scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards",
      },

      keyframes: {
        fadeUp:     { "0%": { opacity:"0", transform:"translateY(20px)" }, "100%": { opacity:"1", transform:"translateY(0)" } },
        fadeIn:     { "0%": { opacity:"0" }, "100%": { opacity:"1" } },
        slideIn:    { "0%": { opacity:"0", transform:"translateX(-20px)" }, "100%": { opacity:"1", transform:"translateX(0)" } },
        slideUp:    { "0%": { opacity:"0", transform:"translateY(40px) scale(0.96)" }, "100%": { opacity:"1", transform:"translateY(0) scale(1)" } },
        shimmer:    { "0%": { backgroundPosition:"-600px 0" }, "100%": { backgroundPosition:"600px 0" } },
        glowPulse:  { "0%,100%": { opacity:"0.6" }, "50%": { opacity:"1" } },
        bounceIn:   { "0%": { opacity:"0", transform:"scale(0.7)" }, "100%": { opacity:"1", transform:"scale(1)" } },
        ripple:     { "0%": { transform:"scale(0)", opacity:"0.4" }, "100%": { transform:"scale(4)", opacity:"0" } },
        float:      { "0%,100%": { transform:"translateY(0)" }, "50%": { transform:"translateY(-8px)" } },
        scaleIn:    { "0%": { opacity:"0", transform:"scale(0.9)" }, "100%": { opacity:"1", transform:"scale(1)" } },
      },

      backdropBlur: { xs: "2px", "4xl": "48px" },
    },
  },
  plugins: [],
};
export default config;
