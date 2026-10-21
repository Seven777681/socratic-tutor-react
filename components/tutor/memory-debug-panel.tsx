"use client";

import { useCallback, useEffect, useState } from "react";
import type { MemoryDebugSnapshot } from "@/types/memory-debug";
import { getAuthToken } from "@/lib/auth/client-auth";

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-3 text-[11px] leading-5 text-emerald-300">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function MemoryDebugPanel({
  taskId,
  conversationId,
  messageCount,
}: {
  taskId: string;
  conversationId: string;
  messageCount: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<MemoryDebugSnapshot | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    const token = getAuthToken() ?? "";
    setIsLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ taskId, conversationId });
      const response = await fetch(`/api/memory/debug?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = (await response.json()) as MemoryDebugSnapshot & { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to load memory data.");
      setSnapshot(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load memory data.");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, taskId]);

  useEffect(() => {
    if (isOpen) void refresh();
  }, [isOpen, messageCount, refresh]);

  return (
    <div className="border-t border-amber-200 bg-amber-50/70 px-4 py-2">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="text-xs font-extrabold uppercase tracking-[0.14em] text-amber-800"
        >
          {isOpen ? "Hide" : "Show"} Memory Debug
        </button>
        {isOpen ? (
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={isLoading}
            className="rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-bold text-amber-800 disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Refresh"}
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div className="mt-3 max-h-[45vh] space-y-3 overflow-y-auto pb-2">
          {error ? <p className="text-xs font-semibold text-rose-700">{error}</p> : null}
          {!snapshot && !error ? <p className="text-xs text-slate-500">Loading memory data...</p> : null}
          {snapshot ? (
            <>
              <section>
                <h3 className="mb-1 text-xs font-extrabold text-slate-700">Latest memory usage</h3>
                <JsonBlock value={snapshot.latest_usage?.evidence ?? null} />
              </section>
              <section>
                <h3 className="mb-1 text-xs font-extrabold text-slate-700">Stable learner profile</h3>
                <JsonBlock value={snapshot.profile ?? null} />
              </section>
              <section>
                <h3 className="mb-1 text-xs font-extrabold text-slate-700">
                  Concept mastery scores ({snapshot.concept_masteries.length})
                </h3>
                <JsonBlock value={snapshot.concept_masteries} />
              </section>
              <section>
                <h3 className="mb-1 text-xs font-extrabold text-slate-700">
                  Score change history ({snapshot.score_events.length})
                </h3>
                <JsonBlock value={snapshot.score_events} />
              </section>
              <section>
                <h3 className="mb-1 text-xs font-extrabold text-slate-700">
                  Short-term messages ({snapshot.short_term_messages.length})
                </h3>
                <JsonBlock value={snapshot.short_term_messages} />
              </section>
              <section>
                <h3 className="mb-1 text-xs font-extrabold text-slate-700">
                  Profile evidence ({snapshot.profile_observations.length})
                </h3>
                <JsonBlock value={snapshot.profile_observations} />
              </section>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
