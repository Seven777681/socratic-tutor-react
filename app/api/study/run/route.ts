import { NextResponse } from "next/server";

const BACKEND_URL = process.env.SOCRATIC_BACKEND_URL || "http://127.0.0.1:8001";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid run record." }, { status: 400 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/study/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json({ error: "Run record was not saved." }, { status: response.status });
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    console.error("Failed to persist code run:", error);
    return NextResponse.json({ error: "Run record service is unreachable." }, { status: 503 });
  }
}
