import { NextResponse } from "next/server";

const BACKEND_URL = process.env.SOCRATIC_BACKEND_URL || "http://127.0.0.1:8001";

export async function GET(request: Request) {
  const studySessionId = new URL(request.url).searchParams.get("studySessionId");
  if (!studySessionId) {
    return NextResponse.json({ error: "Missing study session." }, { status: 400 });
  }
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/ct-assessment/question-sets?studySessionId=${encodeURIComponent(studySessionId)}`,
      { cache: "no-store" },
    );
    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ error: "CT assessment service is unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.studySessionId || !body?.questionSetId || !Array.isArray(body?.taskIds)) {
    return NextResponse.json({ error: "Invalid question-set assessment request." }, { status: 400 });
  }
  try {
    const response = await fetch(`${BACKEND_URL}/api/ct-assessment/question-sets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ error: "CT scoring did not finish in time." }, { status: 503 });
  }
}
