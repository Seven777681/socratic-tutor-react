import type { TutorRequest, TutorResponse } from "@/types/tutor";

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
      },
      body: JSON.stringify(payload),
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
