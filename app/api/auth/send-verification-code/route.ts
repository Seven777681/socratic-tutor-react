import { NextResponse } from "next/server";
import type { SendVerificationCodeRequest } from "@/types/auth";
import { isValidEmail, normalizeUsername } from "@/lib/auth/username-utils";

const BACKEND_URL = process.env.SOCRATIC_BACKEND_URL || "http://127.0.0.1:8001";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<SendVerificationCodeRequest>;
  const username = normalizeUsername(body.username ?? "");
  const uiLanguage = body.uiLanguage === "zh" ? "zh" : "en";

  if (!username) {
    return NextResponse.json(
      { success: false, message: "Please enter your username." },
      { status: 400 },
    );
  }

  if (!isValidEmail(username)) {
    return NextResponse.json(
      {
        success: false,
        message: "Please enter a valid email address. Phone verification is not available yet.",
      },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/verification-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, uiLanguage }),
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(
      response.ok
        ? data
        : { success: false, message: data.detail ?? "Unable to send verification code right now." },
      { status: response.status },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Email verification service is unavailable." },
      { status: 503 },
    );
  }
}
