import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.SOCRATIC_BACKEND_URL || "http://127.0.0.1:8000";

interface CodeRunRequestBody {
  taskId: string;
  code: string;
  stdin: string;
  testCases?: Array<{
    id: string;
    name?: string;
    input?: string;
    expectedOutput?: string;
  }>;
}

export async function POST(request: Request) {
  let body: CodeRunRequestBody;

  try {
    body = (await request.json()) as CodeRunRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid code run request." },
      { status: 400 },
    );
  }

  if (!body.taskId || typeof body.code !== "string") {
    return NextResponse.json(
      { error: "Invalid code run request." },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/code/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      // Real subprocess execution can take a few seconds for slow loops.
      cache: "no-store",
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text().catch(() => "");
      console.error("Code execution backend error:", backendResponse.status, errorText);
      return NextResponse.json(
        { error: "Code execution backend request failed." },
        { status: 502 },
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to reach code execution backend:", error);
    return NextResponse.json(
      { error: "Code execution backend is unreachable." },
      { status: 503 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
