import { NextResponse } from "next/server";
import type { TutorRequest } from "@/types/tutor";

const BACKEND_URL =
  process.env.SOCRATIC_BACKEND_URL || "http://127.0.0.1:8001";

export async function POST(request: Request) {
  let body: TutorRequest;

  try {
    body = (await request.json()) as TutorRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid tutor request." },
      { status: 400 },
    );
  }

  if (!body.taskId || !body.stage || !body.mode || !Array.isArray(body.conversation)) {
    return NextResponse.json(
      { error: "Invalid tutor request." },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/tutor/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      // The Python agents call an LLM and can take a while to respond.
      cache: "no-store",
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text().catch(() => "");
      console.error("Socratic backend error:", backendResponse.status, errorText);
      return NextResponse.json(
        { error: "The AI model service could not complete the tutor response." },
        { status: 502 },
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to reach socratic backend:", error);
    return NextResponse.json(
      { error: "The AI tutor backend is not running." },
      { status: 503 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
