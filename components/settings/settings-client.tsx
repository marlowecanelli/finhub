"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, ShieldCheck, Trash2, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/toast/toast-provider";
import { createClient } from "@/lib/supabase";

type Props = { email: string; createdAt: string | null };

export function SettingsClient({ email, createdAt }: Props) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 md:px-8">
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/30">
          <UserIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Account
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {email}
            {createdAt && (
              <>
                {" "}
                · joined {new Date(createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
              </>
            )}
          </p>
        </div>
      </header>

      <UpdateEmail currentEmail={email} />
      <ChangePassword />
      <DeleteAccount />
    </div>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass p-5 md:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
          {icon}
        </span>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function UpdateEmail({ currentEmail }: { currentEmail: string }) {
  const t = useToast();
  const [email, setEmail] = React.useState(currentEmail);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || email === currentEmail) return;
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.auth.updateUser({ email: email.trim() });
      if (error) throw error;
      t.success("Email update started", "Check your inbox to confirm the new address.");
    } catch (err) {
      t.error("Couldn't update email", err instanceof Error ? err.message : "Try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section
      icon={<Mail className="h-4 w-4" />}
      title="Email"
      description="Used for sign-in and notifications. A verification email will be sent to the new address."
    >
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="settings-email">Email</Label>
          <Input
            id="settings-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={busy || email === currentEmail || !email.trim()}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Update email
        </Button>
      </form>
    </Section>
  );
}

function ChangePassword() {
  const t = useToast();
  const [pw, setPw] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) {
      t.warning("Password too short", "Use at least 8 characters.");
      return;
    }
    if (pw !== confirm) {
      t.warning("Passwords don't match");
      return;
    }
    setBusy(true);
    try {
      const sb = createClient();
      const { error } = await sb.auth.updateUser({ password: pw });
      if (error) throw error;
      setPw("");
      setConfirm("");
      t.success("Password updated");
    } catch (err) {
      t.error("Couldn't update password", err instanceof Error ? err.message : "Try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section
      icon={<ShieldCheck className="h-4 w-4" />}
      title="Password"
      description="Use a unique password — at least 8 characters."
    >
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="new-pw">New password</Label>
            <Input
              id="new-pw"
              type="password"
              autoComplete="new-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-pw">Confirm</Label>
            <Input
              id="confirm-pw"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
            />
          </div>
        </div>
        <Button type="submit" disabled={busy || !pw}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Update password
        </Button>
      </form>
    </Section>
  );
}

function DeleteAccount() {
  const t = useToast();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (confirm !== "DELETE") return;
    setBusy(true);
    try {
      const r = await fetch("/api/account/delete", { method: "POST" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed");
      t.success("Account deleted");
      setOpen(false);
      router.push("/");
      router.refresh();
    } catch (err) {
      t.error("Couldn't delete", err instanceof Error ? err.message : "Try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section
      icon={<Trash2 className="h-4 w-4" />}
      title="Delete account"
      description="Permanently remove your account and all associated data. This can't be undone."
    >
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" /> Delete account
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete account?</DialogTitle>
            <DialogDescription>
              This permanently removes your portfolios, holdings, watchlists, goals, and presets.
              Type <span className="font-mono font-semibold text-foreground">DELETE</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <Input
              autoFocus
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="DELETE"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={busy || confirm !== "DELETE"}
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete forever
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Section>
  );
}
