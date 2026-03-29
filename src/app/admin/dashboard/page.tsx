"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { DashboardStats } from "@/types";

const C = {
  primary: "#001857",
  primaryContainer: "#1b2f6e",
  primaryFixed: "#dce1ff",
  surface: "#f7f9ff",
  surfaceContainerLow: "#edf4ff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerHigh: "#d9eaff",
  onSurface: "#091d2e",
  onSurfaceVariant: "#454650",
  outlineVariant: "#c5c5d2",
  secondaryContainer: "#fdab12",
  error: "#ba1a1a",
};

interface StatCard { label: string; value: string | number; icon: string; sub?: string; color?: string; }

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((j) => setStats(j.data))
      .catch(() => router.push("/admin"))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined animate-spin text-4xl" style={{ color: C.primary }}>
          progress_activity
        </span>
      </div>
    );
  }

  const statCards: StatCard[] = [
    { label: "Total Voters", value: stats.totalVoters.toLocaleString(), icon: "group", sub: "Registered" },
    {
      label: "Votes Cast",
      value: stats.totalVoted.toLocaleString(),
      icon: "how_to_vote",
      sub: `${stats.turnoutPercent.toFixed(1)}% turnout`,
      color: "#10b981",
    },
    {
      label: "Votes Remaining",
      value: stats.votesRemaining.toLocaleString(),
      icon: "pending",
      sub: "Yet to vote",
      color: "#f59e0b",
    },
    {
      label: "Election Status",
      value: stats.isElectionClosed ? "Closed" : "Live",
      icon: stats.isElectionClosed ? "lock" : "radio_button_checked",
      sub: stats.isElectionClosed ? "Results locked" : "Accepting votes",
      color: stats.isElectionClosed ? C.error : "#10b981",
    },
  ];

  const maxCount = Math.max(...stats.votesPerHour.map((h) => h.count), 1);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: C.primary }}>
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: C.onSurfaceVariant }}>
            Real-time election monitoring
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono"
          style={{
            backgroundColor: stats.isElectionClosed ? "rgba(186,26,26,0.08)" : "rgba(16,185,129,0.08)",
            color: stats.isElectionClosed ? C.error : "#059669",
            border: `1px solid ${stats.isElectionClosed ? "rgba(186,26,26,0.2)" : "rgba(16,185,129,0.2)"}`,
          }}
        >
          <span
            className="material-symbols-outlined text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {stats.isElectionClosed ? "lock" : "radio_button_checked"}
          </span>
          {stats.isElectionClosed ? "ELECTION CLOSED" : "ELECTION LIVE"}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl p-6 flex flex-col gap-3"
            style={{
              backgroundColor: C.surfaceContainerLowest,
              boxShadow: "0 1px 8px rgba(9,29,46,0.06)",
              border: `1px solid ${C.outlineVariant}30`,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: C.onSurfaceVariant }}>
                {card.label}
              </span>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${card.color ?? C.primary}15` }}
              >
                <span className="material-symbols-outlined text-sm" style={{ color: card.color ?? C.primary }}>
                  {card.icon}
                </span>
              </div>
            </div>
            <div>
              <p className="text-3xl font-extrabold tracking-tight" style={{ color: C.onSurface }}>
                {card.value}
              </p>
              {card.sub && (
                <p className="text-sm mt-0.5" style={{ color: C.onSurfaceVariant }}>{card.sub}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Turnout progress bar */}
      <div
        className="rounded-xl p-6"
        style={{
          backgroundColor: C.surfaceContainerLowest,
          boxShadow: "0 1px 8px rgba(9,29,46,0.06)",
          border: `1px solid ${C.outlineVariant}30`,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg" style={{ color: C.primary }}>Voter Turnout</h2>
          <span className="font-mono font-bold text-2xl" style={{ color: C.primary }}>
            {stats.turnoutPercent.toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-4 rounded-full overflow-hidden" style={{ backgroundColor: C.surfaceContainerHigh }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${stats.turnoutPercent}%`,
              background: `linear-gradient(to right, ${C.primaryContainer}, ${C.secondaryContainer})`,
            }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs" style={{ color: C.onSurfaceVariant }}>
            {stats.totalVoted.toLocaleString()} voted
          </span>
          <span className="text-xs" style={{ color: C.onSurfaceVariant }}>
            {stats.totalVoters.toLocaleString()} total
          </span>
        </div>
      </div>

      {/* Votes per hour chart */}
      <div
        className="rounded-xl p-6"
        style={{
          backgroundColor: C.surfaceContainerLowest,
          boxShadow: "0 1px 8px rgba(9,29,46,0.06)",
          border: `1px solid ${C.outlineVariant}30`,
        }}
      >
        <h2 className="font-bold text-lg mb-6" style={{ color: C.primary }}>
          Votes per Hour (Last 12h)
        </h2>
        {stats.votesPerHour.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: C.onSurfaceVariant }}>
            No voting activity yet.
          </p>
        ) : (
          <div className="flex items-end gap-2 h-32">
            {stats.votesPerHour.map((h) => (
              <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm transition-all duration-500"
                  style={{
                    height: `${Math.max((h.count / maxCount) * 100, 4)}%`,
                    background: `linear-gradient(to top, ${C.primaryContainer}, ${C.primaryFixed})`,
                    minHeight: "4px",
                  }}
                  title={`${h.hour}: ${h.count} votes`}
                />
                <span className="text-[9px] font-mono" style={{ color: C.onSurfaceVariant }}>
                  {h.hour.split(":")[0]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div
        className="rounded-xl p-6"
        style={{
          backgroundColor: C.surfaceContainerLowest,
          boxShadow: "0 1px 8px rgba(9,29,46,0.06)",
          border: `1px solid ${C.outlineVariant}30`,
        }}
      >
        <h2 className="font-bold text-lg mb-4" style={{ color: C.primary }}>Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Export Results", icon: "download", href: "/api/admin/export/results" },
            { label: "Export Voters", icon: "group_export", href: "/api/admin/export/voters" },
            { label: "Manage Voters", icon: "manage_accounts", href: "/admin/voters" },
            { label: "Manage Candidates", icon: "person_pin", href: "/admin/candidates" },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: C.surfaceContainerLow,
                color: C.primary,
                border: `1px solid ${C.outlineVariant}40`,
              }}
            >
              <span className="material-symbols-outlined text-sm">{action.icon}</span>
              {action.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
