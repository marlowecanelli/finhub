"use client";

import { useState } from "react";
import { Copy, Download, X, Check, Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  url: string;
  filename: string;
};

export function ShareCard({ open, onClose, url, filename }: Props) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!open) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.origin + url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* swallow */
    }
  }

  async function download() {
    setDownloading(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#0e1119] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-white/5 bg-black/40 p-1">
          {/* Inline preview of OG image */}
          <img
            src={url}
            alt="Share card preview"
            className="h-auto w-full rounded-lg"
          />
        </div>

        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-display text-lg text-white">
              Shareable card
            </div>
            <div className="text-xs text-white/50">
              1200 × 630, ready for Twitter, LinkedIn, or your group chat.
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10"
            >
              {copied ? (
                <Check className="h-4 w-4 text-hindsight-gain" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy link"}
            </button>
            <button
              type="button"
              onClick={download}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-md bg-hindsight-gain px-3 py-2 text-sm font-medium text-black transition-all hover:brightness-110 disabled:opacity-60"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
