import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="bg-aurora pointer-events-none fixed inset-0" aria-hidden />
      <div
        className="bg-dotgrid pointer-events-none fixed inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] opacity-50"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-16">
        <Link href="/" className="group mb-12 flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-sm bg-foreground text-background">
            <span className="font-display text-lg font-semibold leading-none">
              F
            </span>
            <div className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[hsl(var(--signal))] shadow-[0_0_8px_hsl(var(--signal))] animate-[signal-pulse_2.4s_ease-in-out_infinite]" />
          </div>
          <span className="font-display text-xl font-medium tracking-tight">
            FinHub
          </span>
        </Link>
        <div className="w-full blur-in">{children}</div>
      </div>
    </div>
  );
}
