import { NextResponse } from "next/server";

const BACKEND_URL = process.env.SOCRATIC_BACKEND_URL || "http://127.0.0.1:8001";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ error: "Sign in to start a study session." }, { status: 401 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/study/session/account`, {
      method: "POST",
      headers: { Authorization: authorization },
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: "Study session service is unavailable." },
      { status: 503 },
    );
  }
}
