export interface StudyTaskAttempt {
  task_id: string;
  status: string;
  current_stage?: string | null;
  entry_path?: string | null;
  student_plan?: Record<string, unknown> | null;
  final_code?: string | null;
  planning_revision_count?: number;
  code_attempt_count?: number;
  completed_at?: string | null;
}

let cachedSessionId = "";
let cachedRequest: Promise<StudyTaskAttempt[]> | null = null;

export function invalidateStudyProgress() {
  cachedSessionId = "";
  cachedRequest = null;
}

export function getStudyProgress(): Promise<StudyTaskAttempt[]> {
  if (typeof window === "undefined") return Promise.resolve([]);

  const sessionId = window.sessionStorage.getItem("socratic-study-session-id") ?? "";
  if (!sessionId) return Promise.resolve([]);

  if (cachedSessionId !== sessionId || !cachedRequest) {
    cachedSessionId = sessionId;
    cachedRequest = fetch(
      `/api/study/progress?studySessionId=${encodeURIComponent(sessionId)}`,
      { cache: "no-store" },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("Progress could not be loaded.");
        const payload = (await response.json()) as { attempts?: StudyTaskAttempt[] };
        return payload.attempts ?? [];
      })
      .catch(() => []);
  }

  return cachedRequest;
}

export async function getStudyTaskAttempt(taskId: string) {
  const attempts = await getStudyProgress();
  return attempts.find((attempt) => attempt.task_id === taskId);
}
