import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const PUBLIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1.0, changeFrequency: "weekly" },
  { path: "/sign-in", priority: 0.5, changeFrequency: "yearly" },
  { path: "/sign-up", priority: 0.7, changeFrequency: "yearly" },
  { path: "/dashboard", priority: 0.9, changeFrequency: "daily" },
  { path: "/screener", priority: 0.9, changeFrequency: "daily" },
  { path: "/builder", priority: 0.8, changeFrequency: "monthly" },
  { path: "/calculators", priority: 0.8, changeFrequency: "monthly" },
  { path: "/calculators/dividend", priority: 0.7, changeFrequency: "monthly" },
  { path: "/calculators/position-size", priority: 0.7, changeFrequency: "monthly" },
  { path: "/calculators/savings-goals", priority: 0.7, changeFrequency: "monthly" },
  { path: "/news", priority: 0.8, changeFrequency: "hourly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PUBLIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
