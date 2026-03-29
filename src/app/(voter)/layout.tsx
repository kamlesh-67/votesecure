import type { ReactNode } from "react";

export default function VoterLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      {children}
    </div>
  );
}
