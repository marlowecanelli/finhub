import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { PageTransition } from "@/components/layout/page-transition";
import { Footer } from "@/components/layout/footer";
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
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-[0.08]" />

      <Sidebar />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <TopBar email={email} name={name} avatarUrl={avatarUrl} />
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
      </div>
    </div>
  );
}
