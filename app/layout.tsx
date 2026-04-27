import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Instrument_Serif, Fraunces } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast/toast-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "FinHub — A terminal for the rest of us.",
    template: "%s · FinHub",
  },
  description:
    "Research equities, build portfolios, track goals, and read the market — all in one editorial-grade workspace.",
  keywords: [
    "stock screener",
    "portfolio tracker",
    "dividend calculator",
    "AI investing",
    "financial dashboard",
  ],
  applicationName: "FinHub",
  authors: [{ name: "FinHub" }],
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "FinHub — A terminal for the rest of us.",
    description:
      "Research equities, build portfolios, track goals, and read the market.",
    url: SITE_URL,
    siteName: "FinHub",
    images: ["/og.svg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FinHub",
    description: "A terminal for the rest of us.",
    images: ["/og.svg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} ${fraunces.variable}`}
    >
      <body className="grain min-h-screen bg-background font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="finhub-theme"
          disableTransitionOnChange
        >
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
