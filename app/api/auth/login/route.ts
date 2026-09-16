import { NextResponse } from "next/server";
import type { LoginRequest } from "@/types/auth";
import { normalizeUsername } from "@/lib/auth/username-utils";

const BACKEND_URL = process.env.SOCRATIC_BACKEND_URL || "http://127.0.0.1:8001";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<LoginRequest>;
  const username = normalizeUsername(body.username ?? "");
  const password = body.password ?? "";

  if (!username || !password) {
    return NextResponse.json(
      {
        success: false,
        message: "Incorrect username or password. Please try again.",
      },
      { status: 401 },
    );
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(
      response.ok
        ? data
        : { success: false, message: data.detail ?? "Incorrect username or password. Please try again." },
      { status: response.status },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Authentication service is unavailable." },
      { status: 503 },
    );
  }
}
