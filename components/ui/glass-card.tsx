import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  gradient?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, interactive, gradient, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass",
          interactive && "glass-hover cursor-pointer",
          className
        )}
        {...props}
      >
        {gradient && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent"
          />
        )}
        <div className="relative">{children}</div>
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";
