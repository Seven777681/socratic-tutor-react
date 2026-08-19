import { NextResponse } from "next/server";

const BACKEND_URL = process.env.SOCRATIC_BACKEND_URL || "http://127.0.0.1:8001";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.taskId || !body?.studySessionId || !body?.plan) {
    return NextResponse.json({ error: "Invalid task draft." }, { status: 400 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/study/draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: "Study draft service is unavailable." },
      { status: 503 },
    );
  }
}
