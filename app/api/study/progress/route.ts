import { NextResponse } from "next/server";

const BACKEND_URL = process.env.SOCRATIC_BACKEND_URL || "http://127.0.0.1:8001";

export async function GET(request: Request) {
  const studySessionId = new URL(request.url).searchParams.get("studySessionId");
  if (!studySessionId) {
    return NextResponse.json({ error: "Missing study session." }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/study/progress?studySessionId=${encodeURIComponent(studySessionId)}`,
      { cache: "no-store" },
    );
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: "Study progress service is unavailable." },
      { status: 503 },
    );
  }
}
