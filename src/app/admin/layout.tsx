"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { toast } from "sonner";

const C = {
  primary: "#001857",
  primaryContainer: "#1b2f6e",
  surface: "#f7f9ff",
  surfaceContainerLow: "#edf4ff",
  surfaceContainerLowest: "#ffffff",
  onSurface: "#091d2e",
  onSurfaceVariant: "#454650",
  outlineVariant: "#c5c5d2",
  secondaryContainer: "#fdab12",
};

const NAV_ITEMS = [
  { href: "/admin/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/admin/voters", icon: "group", label: "Voters" },
  { href: "/admin/candidates", icon: "person_pin", label: "Candidates" },
  { href: "/admin/results", icon: "analytics", label: "Results" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Don't wrap login/verify in the sidebar shell
  const isPublicAdminPage = pathname === "/admin" || pathname === "/admin/verify";
  if (isPublicAdminPage) return <>{children}</>;

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", body: JSON.stringify({ role: "admin" }), headers: { "Content-Type": "application/json" } });
    } finally {
      router.push("/admin");
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: C.surface }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 h-screen z-50 flex flex-col p-4 gap-2 transition-transform duration-300"
        style={{
          width: "256px",
          backgroundColor: "#f8fafc",
          borderRight: `1px solid ${C.outlineVariant}50`,
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        {/* Logo */}
        <div className="mb-8 px-4 py-2">
          <h1 className="text-lg font-black uppercase tracking-tighter" style={{ color: C.primary }}>
            Admin Console
          </h1>
          <p className="text-[10px] font-medium tracking-widest uppercase mt-1" style={{ color: C.onSurfaceVariant }}>
            Institutional Authority
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: isActive ? C.surfaceContainerLowest : "transparent",
                  color: isActive ? C.primary : C.onSurfaceVariant,
                  borderLeft: isActive ? `4px solid ${C.secondaryContainer}` : "4px solid transparent",
                  fontWeight: isActive ? 600 : 400,
                  boxShadow: isActive ? "0 1px 4px rgba(9,29,46,0.08)" : "none",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{item.icon}</span>
                <span className="text-sm tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div
          className="mt-auto pt-4 border-t flex flex-col gap-1"
          style={{ borderColor: `${C.outlineVariant}50` }}
        >
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-xs font-medium rounded-lg transition-colors w-full text-left"
            style={{ color: "#ba1a1a" }}
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Desktop sidebar (always visible on lg+) */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-screen z-50 flex-col p-4 gap-2"
        style={{
          width: "256px",
          backgroundColor: "#f8fafc",
          borderRight: `1px solid ${C.outlineVariant}50`,
        }}
      >
        <div className="mb-8 px-4 py-2">
          <h1 className="text-lg font-black uppercase tracking-tighter" style={{ color: C.primary }}>
            Admin Console
          </h1>
          <p className="text-[10px] font-medium tracking-widest uppercase mt-1" style={{ color: C.onSurfaceVariant }}>
            Institutional Authority
          </p>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: isActive ? C.surfaceContainerLowest : "transparent",
                  color: isActive ? C.primary : C.onSurfaceVariant,
                  borderLeft: isActive ? `4px solid ${C.secondaryContainer}` : "4px solid transparent",
                  fontWeight: isActive ? 600 : 400,
                  boxShadow: isActive ? "0 1px 4px rgba(9,29,46,0.08)" : "none",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{item.icon}</span>
                <span className="text-sm tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-4 border-t flex flex-col gap-1" style={{ borderColor: `${C.outlineVariant}50` }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-xs font-medium rounded-lg w-full text-left"
            style={{ color: "#ba1a1a" }}
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Topbar */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 lg:py-3"
          style={{
            backgroundColor: "rgba(247,249,255,0.9)",
            backdropFilter: "blur(20px)",
            borderBottom: `1px solid ${C.outlineVariant}30`,
          }}
        >
          <button className="lg:hidden p-2" onClick={() => setSidebarOpen(true)}>
            <span className="material-symbols-outlined" style={{ color: C.primary }}>menu</span>
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
              style={{ backgroundColor: C.surfaceContainerLow, color: C.primary }}
            >
              <span className="material-symbols-outlined text-xs" style={{ color: "#10b981", fontVariationSettings: "'FILL' 1" }}>
                circle
              </span>
              System Online
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
