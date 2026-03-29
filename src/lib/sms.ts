import axios from "axios";

interface SmsResult {
  success: boolean;
  message: string;
}

/**
 * Sends an OTP via MSG91 REST API.
 *
 * Dev-mode fallback: when MSG91_AUTH_KEY is not set (or equals the placeholder),
 * the OTP is logged to the console instead of sending an SMS — so the full flow
 * works without real credentials during development.
 */
export async function sendOtpSms(
  mobile: string,
  otp: string,
): Promise<SmsResult> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const isDev = !authKey || authKey === "your-msg91-auth-key";

  // ── Dev-mode bypass ──────────────────────────────────────────────────────
  if (isDev) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📱 [DEV] OTP for ${mobile}: ${otp}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return { success: true, message: "OTP logged to console (dev mode)" };
  }

  // ── Production MSG91 call ────────────────────────────────────────────────
  try {
    const response = await axios.post(
      "https://api.msg91.com/api/v5/otp",
      {
        template_id: process.env.MSG91_TEMPLATE_ID,
        mobile: `91${mobile}`, // Prefix 91 for India
        authkey: authKey,
        otp,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10_000, // 10s timeout
      },
    );

    if (response.data?.type === "success") {
      return { success: true, message: "OTP sent" };
    }

    return {
      success: false,
      message: response.data?.message ?? "SMS failed — unknown error",
    };
  } catch (error: unknown) {
    console.error("MSG91 error:", error);
    return { success: false, message: "SMS service unavailable" };
  }
}
