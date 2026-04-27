"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";

type Mode = "sign-in" | "sign-up";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } =
        mode === "sign-in"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
              },
            });
      if (error) throw error;
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  const eyebrow = mode === "sign-in" ? "Returning reader" : "New subscription";
  const title = mode === "sign-in" ? "Welcome back." : "Create your account.";
  const subtitle =
    mode === "sign-in"
      ? "Sign in to access your portfolio and insights."
      : "Join FinHub and start building smarter.";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full"
    >
      <div className="card-edge relative overflow-hidden rounded-2xl border border-border/80 bg-card/60 p-8 backdrop-blur-2xl md:p-10">
        <div className="mb-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-display text-4xl font-medium tracking-tight md:text-5xl">
            {title.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="display-italic text-foreground/70">
              {title.split(" ").slice(-1)[0]}
            </span>
          </h1>
          <p className="mt-3 text-sm text-foreground/65">{subtitle}</p>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogle}
          disabled={loading}
          type="button"
        >
          <GoogleIcon />
          Continue with Google
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card/60 px-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-sm">
              or with email
            </span>
          </div>
        </div>

        <form onSubmit={handleEmail} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" variant="signal" className="sweep w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "sign-in" ? "Sign in →" : "Create account →"}
          </Button>
        </form>

        <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {mode === "sign-in" ? (
            <>
              No account?{" "}
              <Link href="/sign-up" className="text-foreground hover:text-[hsl(var(--signal))]">
                Sign up →
              </Link>
            </>
          ) : (
            <>
              Already a reader?{" "}
              <Link href="/sign-in" className="text-foreground hover:text-[hsl(var(--signal))]">
                Sign in →
              </Link>
            </>
          )}
        </p>
      </div>
    </motion.div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.43-1.68 4.2-5.5 4.2-3.3 0-6-2.74-6-6.12S8.7 6.06 12 6.06c1.88 0 3.14.8 3.86 1.48l2.63-2.54C16.9 3.52 14.66 2.5 12 2.5 6.76 2.5 2.5 6.76 2.5 12S6.76 21.5 12 21.5c6.92 0 9.5-4.86 9.5-7.36 0-.5-.06-.9-.14-1.28H12z"
      />
    </svg>
  );
}
