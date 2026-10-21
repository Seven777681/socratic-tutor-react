import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.SOCRATIC_BACKEND_URL || "http://127.0.0.1:8001";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const incomingUrl = new URL(request.url);
  const taskId = incomingUrl.searchParams.get("taskId");
  const conversationId = incomingUrl.searchParams.get("conversationId");
  if (!taskId || !conversationId) {
    return NextResponse.json(
      { error: "taskId and conversationId are required." },
      { status: 400 },
    );
  }

  try {
    const backendUrl = new URL("/api/memory/debug", BACKEND_URL);
    backendUrl.searchParams.set("task_id", taskId);
    backendUrl.searchParams.set("conversation_id", conversationId);
    const response = await fetch(backendUrl, {
      headers: { Authorization: authorization },
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Failed to load memory debug data:", error);
    return NextResponse.json(
      { error: "Memory debug backend is unavailable." },
      { status: 503 },
    );
  }
}
