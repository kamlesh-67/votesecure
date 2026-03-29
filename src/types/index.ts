// ============================================================
// JWT Payload Types
// ============================================================

export interface VoterPayload {
  voterId: string;
  mobile: string;
  role: "voter";
}

export interface AdminPayload {
  adminId: string;
  mobile: string;
  role: "admin" | "super_admin";
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================
// Voter Types
// ============================================================

export interface VoterListItem {
  id: string;
  name: string;
  mobile: string; // masked: XXXXXX1234
  isActive: boolean;
  hasVoted: boolean;
  votedAt: string | null;
  voteReferenceId: string | null;
}

export interface VoterMe {
  id: string;
  name: string;
  mobile: string; // masked
  hasVoted: boolean;
}

// ============================================================
// Candidate Types
// ============================================================

export interface CandidatePublic {
  id: string;
  serialNumber: number;
  name: string;
  position: string | null;
  party: string | null;
  bio: string | null;
  photoUrl: string | null;
  symbolUrl: string | null;
  isNota: boolean;
}

export interface CandidateAdmin extends CandidatePublic {
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface CandidateWithVotes extends CandidateAdmin {
  voteCount: number;
  percentage: number;
  rank: number;
}

// ============================================================
// Dashboard & Stats Types
// ============================================================

export interface DashboardStats {
  totalVoters: number;
  totalVoted: number;
  turnoutPercent: number;
  votesRemaining: number;
  votesPerHour: VotesPerHour[];
  isElectionClosed: boolean;
}

export interface VotesPerHour {
  hour: string;
  count: number;
}

// ============================================================
// Election Results Types
// ============================================================

export interface ElectionResults {
  candidates: CandidateWithVotes[];
  totalVotes: number;
  totalVoters: number;
  turnoutPercent: number;
  isElectionClosed: boolean;
  winner: CandidateWithVotes | null;
}

export interface ElectionStatus {
  isClosed: boolean;
  closedAt: string | null;
  closedBy: string | null;
  title: string;
}

// ============================================================
// Vote Types
// ============================================================

export interface VoteCastResult {
  success: boolean;
  referenceId: string;
  candidateName: string;
  candidateParty: string | null;
  candidateSymbolUrl: string | null;
  castAt: string;
}

export interface VoteReceiptData {
  referenceId: string;
  voterName: string;
  candidateName: string;
  candidateParty: string | null;
  castAt: string;
  electionTitle: string;
}

// ============================================================
// Audit & Export Types
// ============================================================

export type AuditAction =
  | "OTP_SENT"
  | "OTP_VERIFIED"
  | "OTP_FAILED"
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "VOTE_CAST"
  | "VOTE_ATTEMPT_DUPLICATE"
  | "SESSION_REVOKED"
  | "ADMIN_LOGIN"
  | "CANDIDATE_CREATED"
  | "CANDIDATE_UPDATED"
  | "CANDIDATE_DELETED"
  | "VOTERS_UPLOADED"
  | "RESULTS_EXPORTED"
  | "ELECTION_CLOSED"
  | "VOTER_DISABLED";

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  mobile: string | null;
  adminId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ============================================================
// Voter Upload Types
// ============================================================

export interface VoterUploadRow {
  name: string;
  mobile: string;
}

export interface VoterUploadResult {
  inserted: number;
  duplicates: number;
  errors: VoterUploadError[];
}

export interface VoterUploadError {
  row: number;
  mobile: string;
  reason: string;
}
