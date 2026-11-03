import { NextResponse } from "next/server";
import type { RegisterRequest } from "@/types/auth";
import { isValidEmail, normalizeUsername } from "@/lib/auth/username-utils";

const BACKEND_URL = process.env.SOCRATIC_BACKEND_URL || "http://127.0.0.1:8001";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<RegisterRequest>;
  const username = normalizeUsername(body.username ?? "");
  const verificationCode = body.verificationCode?.trim() ?? "";
  const password = body.password ?? "";
  const confirmPassword = body.confirmPassword ?? "";

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

  if (!verificationCode) {
    return NextResponse.json(
      { success: false, message: "Please enter the verification code." },
      { status: 400 },
    );
  }

  if (!password || password.length < 6) {
    return NextResponse.json(
      { success: false, message: "Password must be at least 6 characters." },
      { status: 400 },
    );
  }

  if (!confirmPassword || confirmPassword !== password) {
    return NextResponse.json(
      { success: false, message: "Passwords do not match." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, verificationCode, password }),
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(
      response.ok
        ? data
        : { success: false, message: data.detail ?? "Account could not be created." },
      { status: response.status },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Authentication service is unavailable." },
      { status: 503 },
    );
  }
}
