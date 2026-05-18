import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/calendar",
  "/screener",
  "/portfolio",
  "/builder",
  "/calculators",
  "/news",
  "/ticker-lookup",
  "/ticker",
  "/watchlist",
  "/settings",
  "/research",
];

// Pro-gated paths. AI API routes return 402; pages redirect to /pricing.
const PRO_PAGE_PREFIXES = ["/research", "/market-recap", "/builder"];
const PRO_API_PREFIXES = ["/api/ai"];

// Kill switch: when false, the paywall is bypassed and everything is free.
// Flip back to true to re-enable gating.
const PAYWALL_ENABLED = false;

const AUTH_ROUTES = ["/sign-in", "/sign-up"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured yet, allow everything so the app still boots.
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/sign-in";
    redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  if (isAuthRoute && user) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/dashboard";
    return NextResponse.redirect(redirect);
  }

  // Pro gating — only checked when the user is signed in and on a Pro path.
  const isProApi = PRO_API_PREFIXES.some((p) => pathname.startsWith(p));
  const isProPage = PRO_PAGE_PREFIXES.some((p) => pathname.startsWith(p));
  if (PAYWALL_ENABLED && user && (isProApi || isProPage)) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle();
    const status = (sub as { status?: string } | null)?.status ?? "";
    const isPro = status === "active" || status === "trialing";
    if (!isPro) {
      if (isProApi) {
        return NextResponse.json(
          { error: "Pro plan required", upgrade_url: "/pricing" },
          { status: 402 }
        );
      }
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/pricing";
      redirect.searchParams.set("locked", pathname);
      return NextResponse.redirect(redirect);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
