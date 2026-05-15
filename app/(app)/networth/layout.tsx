import { NetWorthSubNav } from "@/components/networth/sub-nav";
import { NetWorthBootstrap } from "@/components/networth/bootstrap";

export default function NetWorthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <NetWorthBootstrap />
      <NetWorthSubNav />
      <div>{children}</div>
    </div>
  );
}
