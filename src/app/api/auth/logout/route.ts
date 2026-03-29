export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { ok, serverError } from "@/lib/apiResponse";
import { revokeVoterSession, revokeAdminSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";

const VOTER_COOKIE = process.env.SESSION_COOKIE_NAME ?? "vs_session";
const ADMIN_COOKIE = process.env.ADMIN_SESSION_COOKIE_NAME ?? "vs_admin_session";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const hasVoterSession = !!cookieStore.get(VOTER_COOKIE)?.value;
    const hasAdminSession = !!cookieStore.get(ADMIN_COOKIE)?.value;

    if (hasVoterSession) {
      await revokeVoterSession(""); // Cookie cleared; DB token update skipped on logout
      await logAudit({ action: "SESSION_REVOKED" });
    } else if (hasAdminSession) {
      await revokeAdminSession();
      await logAudit({ action: "SESSION_REVOKED" });
    }

    return ok({ message: "Logged out successfully." });
  } catch (e) {
    console.error("[logout]", e);
    return serverError();
  }
}
