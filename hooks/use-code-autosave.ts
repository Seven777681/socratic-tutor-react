"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SaveStatus } from "@/types/task";

const autosaveDelayMs = 800;

export function useCodeAutosave({
  taskId,
  starterCode,
}: {
  taskId: string;
  starterCode: string;
}) {
  const storageKey = useMemo(() => `socratic-code-${taskId}`, [taskId]);
  const [currentCode, setCurrentCode] = useState(starterCode);
  const [savedCode, setSavedCode] = useState(starterCode);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSavedLabel, setLastSavedLabel] = useState("Saved locally");
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const storedCode = window.localStorage.getItem(storageKey);
    const initialCode = storedCode ?? starterCode;

    setCurrentCode(initialCode);
    setSavedCode(initialCode);
    setSaveStatus("saved");
    setLastSavedLabel(storedCode ? "Draft restored locally" : "Saved locally");
  }, [starterCode, storageKey]);

  const persistCode = useCallback(
    (code: string) => {
      setSaveStatus("saving");
      window.localStorage.setItem(storageKey, code);
      setSavedCode(code);
      window.setTimeout(() => {
        setSaveStatus("saved");
        setLastSavedLabel("Last saved just now");
      }, 220);
    },
    [storageKey],
  );

  const updateCode = useCallback(
    (code: string) => {
      setCurrentCode(code);
      setSaveStatus("unsaved");

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = window.setTimeout(() => {
        persistCode(code);
      }, autosaveDelayMs);
    },
    [persistCode],
  );

  const saveNow = useCallback(() => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    persistCode(currentCode);
  }, [currentCode, persistCode]);

  const resetCode = useCallback(() => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    setCurrentCode(starterCode);
    persistCode(starterCode);
  }, [persistCode, starterCode]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return {
    currentCode,
    savedCode,
    saveStatus,
    lastSavedLabel,
    updateCode,
    saveNow,
    resetCode,
  };
}
