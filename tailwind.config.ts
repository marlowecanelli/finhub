import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        brand: {
          bg: "#0a0e1a",
          accent: "#3b82f6",
          success: "#10b981",
          danger: "#ef4444",
        },
        hindsight: {
          canvas: "#080a10",
          "canvas-elevated": "#0e1119",
          gain: "#c8a85a",
          "gain-deep": "#7a9a4a",
          pain: "#a8324a",
          "pain-deep": "#7a1f30",
          benchmark: "#7c8aa3",
        },
        research: {
          bg: "#0D0F14",
          surface: "#141720",
          border: "#1E2130",
          muted: "#3A3F52",
          text: "#C8D0E7",
          "text-secondary": "#717A94",
        },
        "accent-cyan": "#00D4FF",
        "accent-green": "#39FF14",
        "accent-amber": "#FFB347",
        "accent-red": "#FF4545",
        "buy-green": "#00C896",
        "sell-red": "#FF5252",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
        serif: ["var(--font-instrument-serif)", "Iowan Old Style", "Palatino", "serif"],
        display: ["var(--font-fraunces)", "Iowan Old Style", "Palatino", "serif"],
        data: ["var(--font-jetbrains-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
        syne: ["Syne", "system-ui", "sans-serif"],
        "dm-sans": ["DM Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.85)" },
        },
        "ticker-flash": {
          "0%": { opacity: "1" },
          "50%": { opacity: "0.3" },
          "100%": { opacity: "1" },
        },
        "data-rise": {
          from: { opacity: "0", transform: "translate3d(0, 12px, 0)" },
          to: { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translate3d(100%, 0, 0)" },
          to: { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        "anomaly-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255, 179, 71, 0.4)" },
          "50%": { boxShadow: "0 0 0 6px rgba(255, 179, 71, 0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2.2s linear infinite",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "ticker-flash": "ticker-flash 0.6s ease-in-out",
        "data-rise": "data-rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-in-right": "slide-in-right 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
        "anomaly-pulse": "anomaly-pulse 2s ease-in-out infinite",
      },
      backgroundImage: {
        "glass-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
