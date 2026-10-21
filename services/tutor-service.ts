import type { TutorRequest, TutorResponse } from "@/types/tutor";
import { getAuthToken } from "@/lib/auth/client-auth";

export async function getTutorResponse(
  payload: TutorRequest,
): Promise<TutorResponse["message"]> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch("/api/tutor/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken() ?? ""}`,
      },
      body: JSON.stringify({
        ...payload,
        studySessionId: window.sessionStorage.getItem("socratic-study-session-id"),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      throw new Error(data?.error || "Tutor request failed.");
    }

    const data = (await response.json()) as TutorResponse;
    return data.message;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
