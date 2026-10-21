import { NextResponse } from "next/server";

const BACKEND_URL = process.env.SOCRATIC_BACKEND_URL || "http://127.0.0.1:8001";

export async function PATCH(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ success: false, message: "Please sign in again." }, { status: 401 });
  }

  const body = (await request.json()) as { displayName?: string };
  const displayName = body.displayName?.replace(/\s+/g, " ").trim() ?? "";
  if (displayName.length < 2 || displayName.length > 30) {
    return NextResponse.json(
      { success: false, message: "Username must be between 2 and 30 characters." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify({ displayName }),
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(
      response.ok ? data : { success: false, message: data.detail ?? "Username could not be updated." },
      { status: response.status },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Authentication service is unavailable." },
      { status: 503 },
    );
  }
}
