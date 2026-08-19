const participantCodeStorageKey = "socratic-participant-code";

export function getCurrentParticipantCode() {
  if (typeof window === "undefined") return "anonymous";

  const code = window.sessionStorage
    .getItem(participantCodeStorageKey)
    ?.trim()
    .toUpperCase();

  return code && /^U\d{3}$/.test(code) ? code : "anonymous";
}

export function getParticipantTaskStorageKey(prefix: string, taskId: string) {
  return `${prefix}:${getCurrentParticipantCode()}:${taskId}`;
}
