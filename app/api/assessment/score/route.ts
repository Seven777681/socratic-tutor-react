import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.SOCRATIC_BACKEND_URL || "http://127.0.0.1:8001";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid assessment submission." }, { status: 400 });
  }

  if (!body.studySessionId) {
    return NextResponse.json(
      { error: "An active study session is required." },
      { status: 401 },
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);
  try {
    const response = await fetch(`${BACKEND_URL}/api/assessment/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: "Assessment scoring service is unavailable." },
      { status: 503 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
