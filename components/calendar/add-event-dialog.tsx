"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddEventDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [ticker, setTicker] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("09:30");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const event_date = new Date(`${date}T${time}:00`).toISOString();
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          ticker: ticker || undefined,
          event_date,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed");
      onCreated();
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setTicker("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a personal event</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Review NVDA chart" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="ticker">Ticker (optional)</Label>
            <Input id="ticker" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} placeholder="AAPL" />
          </div>
          <div>
            <Label htmlFor="description">Notes (optional)</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="signal" onClick={submit} disabled={submitting || !title || !date}>
            {submitting ? "Saving…" : "Save event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
