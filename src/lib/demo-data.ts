/**
 * ── DEMO DATA ──────────────────────────────────────────────────────────────
 * Returned by all API routes when Prisma cannot reach the database.
 * Set DEMO_MODE=true in .env.local to force demo mode regardless of DB state.
 */

export const DEMO_ELECTION_TITLE = "Greenwood Municipal Elections 2025";

// ── Candidates ──────────────────────────────────────────────────────────────
export const DEMO_CANDIDATES = [
  {
    id: "demo-cand-1",
    name: "Arjun Mehta",
    position: "Mayor",
    party: "Progressive Alliance",
    bio: "Former city planner with 15 years of infrastructure experience.",
    serialNumber: 1,
    photoUrl: null,
    symbolUrl: null,
    displayOrder: 0,
    isNota: false,
    voteCount: 0,
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: "demo-cand-2",
    name: "Priya Sharma",
    position: "Mayor",
    party: "Citizens First Party",
    bio: "Public health advocate and district representative for 8 years.",
    serialNumber: 2,
    photoUrl: null,
    symbolUrl: null,
    displayOrder: 1,
    isNota: false,
    voteCount: 0,
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: "demo-cand-3",
    name: "Vikram Rao",
    position: "Mayor",
    party: "Greenwood Development Front",
    bio: "Entrepreneur and youth community leader.",
    serialNumber: 3,
    photoUrl: null,
    symbolUrl: null,
    displayOrder: 2,
    isNota: false,
    voteCount: 0,
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: "demo-nota",
    name: "None of the Above",
    position: null,
    party: null,
    bio: null,
    serialNumber: 99,
    photoUrl: null,
    symbolUrl: null,
    displayOrder: 99,
    isNota: true,
    voteCount: 0,
    isActive: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
];

// ── Voters ──────────────────────────────────────────────────────────────────
export const DEMO_VOTERS = [
  { id: "v1", name: "Ananya Krishnan", mobile: "9876543210", hasVoted: true,  votedAt: new Date("2025-03-15T09:12:00"), voteReferenceId: "VS-2025-00001", sessionToken: null, tokenExpiry: null, createdAt: new Date("2025-01-01"), updatedAt: new Date() },
  { id: "v2", name: "Rajan Pillai",   mobile: "9123456780", hasVoted: true,  votedAt: new Date("2025-03-15T10:45:00"), voteReferenceId: "VS-2025-00002", sessionToken: null, tokenExpiry: null, createdAt: new Date("2025-01-01"), updatedAt: new Date() },
  { id: "v3", name: "Sunita Yadav",   mobile: "8800001111", hasVoted: false, votedAt: null, voteReferenceId: null, sessionToken: null, tokenExpiry: null, createdAt: new Date("2025-01-01"), updatedAt: new Date() },
  { id: "v4", name: "Deepak Nair",    mobile: "7700002222", hasVoted: true,  votedAt: new Date("2025-03-15T11:20:00"), voteReferenceId: "VS-2025-00003", sessionToken: null, tokenExpiry: null, createdAt: new Date("2025-01-01"), updatedAt: new Date() },
  { id: "v5", name: "Kavitha Menon",  mobile: "9900003333", hasVoted: false, votedAt: null, voteReferenceId: null, sessionToken: null, tokenExpiry: null, createdAt: new Date("2025-01-01"), updatedAt: new Date() },
  { id: "v6", name: "Amit Bose",      mobile: "8811114444", hasVoted: true,  votedAt: new Date("2025-03-15T12:05:00"), voteReferenceId: "VS-2025-00004", sessionToken: null, tokenExpiry: null, createdAt: new Date("2025-01-01"), updatedAt: new Date() },
  { id: "v7", name: "Meera Iyer",     mobile: "9922225555", hasVoted: false, votedAt: null, voteReferenceId: null, sessionToken: null, tokenExpiry: null, createdAt: new Date("2025-01-01"), updatedAt: new Date() },
  { id: "v8", name: "Rahul Gupta",    mobile: "7733336666", hasVoted: true,  votedAt: new Date("2025-03-15T13:30:00"), voteReferenceId: "VS-2025-00005", sessionToken: null, tokenExpiry: null, createdAt: new Date("2025-01-01"), updatedAt: new Date() },
  { id: "v9", name: "Leela Patel",    mobile: "8844447777", hasVoted: false, votedAt: null, voteReferenceId: null, sessionToken: null, tokenExpiry: null, createdAt: new Date("2025-01-01"), updatedAt: new Date() },
  { id: "v10", name: "Suresh Kumar",  mobile: "9955558888", hasVoted: true,  votedAt: new Date("2025-03-15T14:10:00"), voteReferenceId: "VS-2025-00006", sessionToken: null, tokenExpiry: null, createdAt: new Date("2025-01-01"), updatedAt: new Date() },
];

// ── Vote distribution (simulate results) ────────────────────────────────────
export const DEMO_VOTE_COUNTS: Record<string, number> = {
  "demo-cand-1": 312,
  "demo-cand-2": 289,
  "demo-cand-3": 145,
  "demo-nota":    54,
};

export const DEMO_TOTAL_VOTES = Object.values(DEMO_VOTE_COUNTS).reduce((a, b) => a + b, 0);
export const DEMO_TOTAL_VOTERS = 900;
export const DEMO_IS_ELECTION_CLOSED = false;

// ── Demo voter session (mobile: any 10-digit starting with 6-9) ─────────────
export const DEMO_SESSION_VOTER = {
  id: "demo-voter-session",
  name: "Demo Voter",
  mobile: "9999999999",
  hasVoted: false,
  voteReferenceId: null,
  votedAt: null,
};

// ── Votes per hour (fabricated) ─────────────────────────────────────────────
export const DEMO_VOTES_PER_HOUR = [
  { hour: "08:00", count: 18 },
  { hour: "09:00", count: 42 },
  { hour: "10:00", count: 87 },
  { hour: "11:00", count: 103 },
  { hour: "12:00", count: 76 },
  { hour: "13:00", count: 55 },
  { hour: "14:00", count: 91 },
  { hour: "15:00", count: 68 },
  { hour: "16:00", count: 45 },
  { hour: "17:00", count: 88 },
  { hour: "18:00", count: 54 },
  { hour: "19:00", count: 73 },
];

// ── Helper ───────────────────────────────────────────────────────────────────
/** Returns true when DEMO_MODE=true or DATABASE_URL is obviously a placeholder */
export function isDemoMode(): boolean {
  if (process.env.DEMO_MODE === "true") return true;
  const url = process.env.DATABASE_URL ?? "";
  return (
    !url ||
    url === "your-database-url" ||
    url.includes("placeholder") ||
    url.includes("localhost:5432") // optional – keep live if local Postgres exists
  );
}

/** Returns true for Prisma/network errors that indicate no DB connection */
export function isDbConnectionError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message ?? "";
  // Prisma error codes for unreachable / bad credentials
  return (
    msg.includes("P1001") ||
    msg.includes("Can't reach database") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("PrismaClientInitializationError") ||
    err.constructor?.name === "PrismaClientInitializationError"
  );
}
