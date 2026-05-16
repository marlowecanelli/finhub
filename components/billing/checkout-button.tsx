"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

export function CheckoutButton({
  interval,
  label,
  primary,
}: {
  interval: "monthly" | "yearly";
  label: string;
  primary?: boolean;
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? "Failed to start checkout");
      }
      window.location.href = json.url;
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={go}
        disabled={loading}
        className={`flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${
          primary
            ? "bg-primary text-primary-foreground hover:opacity-90"
            : "border bg-background hover:bg-muted"
        }`}
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {label}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </>
  );
}

export function ManageBillingButton() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error ?? "Failed to open portal");
      window.location.href = json.url;
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={go}
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Manage subscription
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </>
  );
}
