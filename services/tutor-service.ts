import type { TutorRequest, TutorResponse } from "@/types/tutor";

export async function getTutorResponse(
  payload: TutorRequest,
): Promise<TutorResponse["message"]> {
  const response = await fetch("/api/tutor/message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Tutor request failed");
  }

  const data = (await response.json()) as TutorResponse;
  return data.message;
}
