import { getAuthToken } from "@/lib/auth/client-auth";

interface StudySessionResponse {
  userId: string;
  userCode: string;
  studySessionId: string;
  resumed: boolean;
  detail?: string;
  error?: string;
}

let pendingSession: Promise<string> | undefined;

export function getStudySessionId() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem("socratic-study-session-id");
}

export async function ensureStudySession(): Promise<string> {
  const existing = getStudySessionId();
  if (existing) return existing;
  if (pendingSession) return pendingSession;

  pendingSession = (async () => {
    const token = getAuthToken();
    if (!token) throw new Error("Please sign in before completing a task.");

    const response = await fetch("/api/study/session/account", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await response.json().catch(() => ({}))) as Partial<StudySessionResponse>;
    if (!response.ok || !data.studySessionId) {
      throw new Error(data.detail || data.error || "Could not start the study session.");
    }

    window.sessionStorage.setItem("socratic-study-session-id", data.studySessionId);
    if (data.userCode) window.sessionStorage.setItem("socratic-participant-code", data.userCode);
    if (data.userId) window.sessionStorage.setItem("socratic-study-user-id", data.userId);
    return data.studySessionId;
  })();

  try {
    return await pendingSession;
  } finally {
    pendingSession = undefined;
  }
}
