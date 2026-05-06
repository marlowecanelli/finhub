import { ResearchSidebar } from "@/components/research/ResearchSidebar";
import { ResearchTopBar } from "@/components/research/ResearchTopBar";

export const metadata = {
  title: "Research | FinHub",
  description: "Institutional-grade data & research intelligence",
};

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen"
      style={{ background: "#0D0F14", color: "#C8D0E7" }}
    >
      <ResearchSidebar />

      <div className="flex flex-1 flex-col min-w-0">
        <ResearchTopBar />

        <main className="flex-1 overflow-auto p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
