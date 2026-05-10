"use client";

import * as React from "react";
import { NotebookPen, Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  ticker: string;
};

type State = "idle" | "loading" | "open" | "saving" | "saved";

export function TickerNote({ ticker }: Props) {
  const [state, setState] = React.useState<State>("idle");
  const [note, setNote] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const hasNote = note !== null && note.trim().length > 0;

  async function openNote(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (state === "loading") return;
    setState("loading");
    try {
      const r = await fetch(`/api/notes?ticker=${encodeURIComponent(ticker)}`);
      const data = (await r.json()) as { note?: string };
      const fetched = data.note ?? "";
      setNote(fetched);
      setDraft(fetched);
      setState("open");
    } catch {
      setState("idle");
    }
  }

  async function save() {
    setState("saving");
    try {
      await fetch("/api/notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticker, note: draft }),
      });
      setNote(draft);
      setState("saved");
      setTimeout(() => setState("open"), 1000);
    } catch {
      setState("open");
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setState("idle");
      setNote(null);
    }
  }

  React.useEffect(() => {
    if (state === "open" && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [state]);

  const isOpen = state === "open" || state === "saving" || state === "saved";
  const isDirty = draft !== (note ?? "");

  return (
    <>
      <button
        type="button"
        onClick={openNote}
        aria-label={`Note for ${ticker}`}
        className={cn(
          "rounded-md p-1 transition-all",
          hasNote
            ? "text-amber-500 opacity-70 hover:opacity-100"
            : "text-muted-foreground opacity-0 hover:bg-accent/10 hover:text-foreground group-hover:opacity-100"
        )}
      >
        {state === "loading" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <NotebookPen className={cn("h-3.5 w-3.5", hasNote && "fill-amber-500/20")} />
        )}
      </button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <NotebookPen className="h-4 w-4 text-amber-500" />
              Notes · <span className="font-mono">{ticker}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Why you're watching it, your thesis, things to remember.
            </p>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Why I'm watching ${ticker}…`}
              rows={6}
              disabled={state === "saving" || state === "saved"}
              className="w-full resize-none rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void save();
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground/60">
                ⌘ Enter to save
              </p>
              <button
                type="button"
                onClick={() => void save()}
                disabled={!isDirty || state === "saving" || state === "saved"}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all",
                  state === "saved"
                    ? "bg-emerald-500/15 text-emerald-600"
                    : isDirty
                    ? "bg-amber-500 text-white shadow-sm hover:bg-amber-600"
                    : "bg-muted/60 text-muted-foreground cursor-not-allowed"
                )}
              >
                {state === "saving" ? (
                  <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</>
                ) : state === "saved" ? (
                  <><Check className="h-3 w-3" /> Saved</>
                ) : (
                  "Save note"
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
