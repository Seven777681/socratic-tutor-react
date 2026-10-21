"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SaveStatus } from "@/types/task";
import { getParticipantTaskStorageKey } from "@/lib/participant-storage";
import { getStudyTaskAttempt } from "@/services/study-progress";
import { localizeStarterCode, useLanguage } from "@/components/i18n/language-provider";

const autosaveDelayMs = 800;

export function useCodeAutosave({
  taskId,
  starterCode,
}: {
  taskId: string;
  starterCode: string;
}) {
  const { language } = useLanguage();
  const storageKey = getParticipantTaskStorageKey("socratic-code", taskId);
  const [currentCode, setCurrentCode] = useState(starterCode);
  const [savedCode, setSavedCode] = useState(starterCode);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSavedLabel, setLastSavedLabel] = useState("Saved locally");
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const storedCode = window.localStorage.getItem(storageKey);
    const restore = async () => {
      const attempt = storedCode ? undefined : await getStudyTaskAttempt(taskId);
      if (cancelled) return;
      const databaseCode = attempt?.final_code?.trim() ? attempt.final_code : null;
      const initialCode = localizeStarterCode(
        storedCode ?? databaseCode ?? starterCode,
        language,
      );

      setCurrentCode(initialCode);
      setSavedCode(initialCode);
      setSaveStatus("saved");
      setLastSavedLabel(
        storedCode ? "Draft restored locally" : databaseCode ? "Draft restored" : "Saved locally",
      );
    };
    void restore();
    return () => { cancelled = true; };
  }, [language, starterCode, storageKey, taskId]);

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
