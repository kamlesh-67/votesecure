import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

type HttpStatus = 200 | 201 | 400 | 401 | 403 | 404 | 409 | 429 | 500;

// ── Helpers ───────────────────────────────────────────────────────────────────

export function ok<T>(data: T, status: 200 | 201 = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data }, { status });
}

export function err(
  message: string,
  status: HttpStatus = 400,
): NextResponse<ApiResponse> {
  return NextResponse.json({ error: message }, { status });
}

export function unauthorized(message = "Unauthorized"): NextResponse<ApiResponse> {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden"): NextResponse<ApiResponse> {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = "Not found"): NextResponse<ApiResponse> {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function conflict(message: string): NextResponse<ApiResponse> {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function tooManyRequests(message = "Too many requests. Please try again later."): NextResponse<ApiResponse> {
  return NextResponse.json({ error: message }, { status: 429 });
}

export function serverError(message = "Internal server error"): NextResponse<ApiResponse> {
  return NextResponse.json({ error: message }, { status: 500 });
}

// ── Validation helper ─────────────────────────────────────────────────────────

/**
 * Formats Zod validation errors into a user-friendly string.
 * Compatible with Zod v4 where issue paths are PropertyKey[].
 */
export function formatZodError(
  issues: { path: PropertyKey[]; message: string }[],
): string {
  return issues
    .map((i) => `${i.path.map(String).join(".")}: ${i.message}`)
    .join(", ");
}

// ── IP extraction ─────────────────────────────────────────────────────────────

/**
 * Extracts the real IP from an incoming Next.js request.
 * Handles X-Forwarded-For from proxies / Vercel.
 */
export function getIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
