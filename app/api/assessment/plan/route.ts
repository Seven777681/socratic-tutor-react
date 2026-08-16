import { NextResponse } from "next/server";

const BACKEND_URL = process.env.SOCRATIC_BACKEND_URL || "http://127.0.0.1:8001";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  try {
    const response = await fetch(`${BACKEND_URL}/api/assessment/plan`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Plan storage service is unavailable." }, { status: 503 });
  }
}
