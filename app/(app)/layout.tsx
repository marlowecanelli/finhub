import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { PageTransition } from "@/components/layout/page-transition";
import { Footer } from "@/components/layout/footer";
import { MarqueeTicker } from "@/components/marquee-ticker";
import { createServerSupabase } from "@/lib/supabase-server";

async function getUser() {
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { email: null, name: null, avatarUrl: null };
    const metadata = (user.user_metadata ?? {}) as {
      full_name?: string;
      name?: string;
      avatar_url?: string;
      picture?: string;
    };
    return {
      email: user.email ?? null,
      name: metadata.full_name ?? metadata.name ?? null,
      avatarUrl: metadata.avatar_url ?? metadata.picture ?? null,
    };
  } catch {
    return { email: null, name: null, avatarUrl: null };
  }
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { email, name, avatarUrl } = await getUser();

  return (
    <div className="relative flex min-h-screen bg-background">
      {/* Atmospheric layers */}
      <div
        className="bg-dotgrid pointer-events-none fixed inset-0 opacity-[0.4]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[40vh] bg-gradient-to-b from-[hsl(var(--signal)/0.04)] to-transparent"
        aria-hidden
      />

      <Sidebar />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <TopBar email={email} name={name} avatarUrl={avatarUrl} />
        <MarqueeTicker />
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
      </div>
    </div>
  );
}
