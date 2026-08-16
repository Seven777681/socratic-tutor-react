import { NextResponse } from "next/server";

const BACKEND_URL = process.env.SOCRATIC_BACKEND_URL || "http://127.0.0.1:8001";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.userCode !== "string") {
    return NextResponse.json({ error: "Enter a participant code." }, { status: 400 });
  }
  try {
    const response = await fetch(`${BACKEND_URL}/api/study/session/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Study session service is unavailable." }, { status: 503 });
  }
}
