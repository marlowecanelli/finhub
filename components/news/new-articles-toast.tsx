"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

type Props = {
  count: number;
  onClick: () => void;
};

export function NewArticlesToast({ count, onClick }: Props) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.button
          type="button"
          onClick={onClick}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-primary/40 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-2xl shadow-primary/30 transition-transform hover:scale-[1.02]"
        >
          <ArrowUp className="h-4 w-4" />
          {count} new {count === 1 ? "article" : "articles"}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
