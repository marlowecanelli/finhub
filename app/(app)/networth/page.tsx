"use client";

import { NetWorthDashboard } from "@/components/networth/dashboard";
import { PrivacyProvider } from "@/components/networth/privacy";
import { AchievementToastHost } from "@/components/networth/toast-host";

export default function NetWorthPage() {
  return (
    <PrivacyProvider>
      <NetWorthDashboard />
      <AchievementToastHost />
    </PrivacyProvider>
  );
}
