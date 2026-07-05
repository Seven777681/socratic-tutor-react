"use client";

import { useEffect } from "react";

export function useEditorShortcuts({
  onSave,
  onRun,
}: {
  onSave: () => void;
  onRun: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isCommand = event.ctrlKey || event.metaKey;

      if (!isCommand) {
        return;
      }

      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        onSave();
      }

      if (event.key === "Enter") {
        event.preventDefault();
        onRun();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onRun, onSave]);
}
