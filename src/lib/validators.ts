import { z } from "zod";

// ── Mobile validation helper ─────────────────────────────────────────────────
const mobileSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Mobile must be a valid 10-digit Indian number (starts with 6-9)");

// ── Auth Schemas ─────────────────────────────────────────────────────────────

export const sendOtpSchema = z.object({
  mobile: mobileSchema,
  purpose: z.enum(["voter", "admin"]),
});

export const verifyOtpSchema = z.object({
  mobile: mobileSchema,
  otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d{6}$/, "OTP must be numeric"),
  purpose: z.enum(["voter", "admin"]),
});

// ── Vote Schema ───────────────────────────────────────────────────────────────

export const voteSchema = z.object({
  candidateId: z.string().min(1, "Invalid candidate ID"),
});

// ── Candidate Schema ──────────────────────────────────────────────────────────

export const candidateSchema = z.object({
  serialNumber: z.number().int().positive("Serial number must be positive"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  position: z.string().max(100).optional().nullable(),
  party: z.string().max(100).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  isActive: z.boolean().default(true),
  isNota: z.boolean().default(false),
  displayOrder: z.number().int().min(0).default(0),
});

export const candidateUpdateSchema = candidateSchema.partial();

export const reorderCandidatesSchema = z.object({
  orderedIds: z.array(z.string().cuid()).min(1, "Must provide at least one candidate ID"),
});

// ── Voter Upload Schema ───────────────────────────────────────────────────────

export const voterRowSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  mobile: mobileSchema,
});

// ── Pagination Schema ─────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  filter: z.enum(["all", "voted", "not_voted"]).default("all"),
});

// ── Shared types (inferred) ───────────────────────────────────────────────────

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
export type CandidateInput = z.infer<typeof candidateSchema>;
export type CandidateUpdateInput = z.infer<typeof candidateUpdateSchema>;
export type ReorderCandidatesInput = z.infer<typeof reorderCandidatesSchema>;
export type VoterRowInput = z.infer<typeof voterRowSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
