"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function ParticipantLoginForm() {
  const router = useRouter();
  const [userCode, setUserCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const normalized = userCode.trim().toUpperCase();
    if (!/^U\d{3}$/.test(normalized)) {
      setError("Enter the participant code provided by the researcher, for example U001.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/study/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userCode: normalized }),
      });
      const data = await response.json();
      if (!response.ok || !data.studySessionId) throw new Error(data.detail || data.error);
      window.sessionStorage.setItem("socratic-study-session-id", data.studySessionId);
      window.sessionStorage.setItem("socratic-participant-code", data.userCode);
      window.sessionStorage.setItem("socratic-study-user-id", data.userId);
      router.push("/tasks");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start the study session.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="grid gap-2">
        <span className="text-sm font-extrabold text-slate-700">Participant Code</span>
        <input
          value={userCode}
          onChange={(event) => setUserCode(event.target.value.toUpperCase())}
          placeholder="U001"
          autoComplete="off"
          maxLength={4}
          className="h-12 rounded-xl border border-slate-200 bg-white px-4 font-mono text-base font-bold uppercase tracking-widest outline-none focus:border-[#6255f6] focus:ring-4 focus:ring-[#6255f6]/10"
        />
      </label>
      {error ? <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p> : null}
      <button
        type="submit"
        disabled={loading || !userCode.trim()}
        className="flex h-[52px] w-full items-center justify-center rounded-xl bg-[linear-gradient(90deg,#6657f5,#4678ff)] px-5 text-base font-bold text-white shadow-lg shadow-indigo-200/80 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Starting session..." : "Start User Test"}
      </button>
      <p className="text-center text-xs font-semibold leading-5 text-slate-500">
        Use only the anonymous code provided by the researcher. Do not enter your name or email.
      </p>
    </form>
  );
}
