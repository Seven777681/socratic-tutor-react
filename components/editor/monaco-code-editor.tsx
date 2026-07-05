"use client";

import dynamic from "next/dynamic";
import type { OnMount, BeforeMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import type { EditorPreferences } from "@/types/task";
import type { CursorPosition } from "@/components/editor/editor-types";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[360px] items-center justify-center bg-[#FBFCFF] text-sm font-bold text-slate-500">
      Loading editor...
    </div>
  ),
});

const defineSocraticTheme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme("socratic-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "6657F5", fontStyle: "bold" },
      { token: "string", foreground: "047857" },
      { token: "number", foreground: "B45309" },
      { token: "comment", foreground: "98A2B3", fontStyle: "italic" },
      { token: "identifier", foreground: "1D4ED8" },
    ],
    colors: {
      "editor.background": "#FBFCFF",
      "editor.foreground": "#101426",
      "editorLineNumber.foreground": "#98A2B3",
      "editorLineNumber.activeForeground": "#6657F5",
      "editor.lineHighlightBackground": "#F4F2FF",
      "editor.selectionBackground": "#DDD9FF",
      "editorCursor.foreground": "#6657F5",
      "editorIndentGuide.background1": "#E4E7F0",
      "editorIndentGuide.activeBackground1": "#CFC9FF",
    },
  });
};

export function MonacoCodeEditor({
  value,
  preferences,
  onChange,
  onCursorChange,
}: {
  value: string;
  preferences: EditorPreferences;
  onChange: (value: string) => void;
  onCursorChange: (position: CursorPosition) => void;
}) {
  const handleMount: OnMount = (instance) => {
    instance.updateOptions({ theme: "socratic-light" });
    onCursorChange({
      lineNumber: instance.getPosition()?.lineNumber ?? 1,
      column: instance.getPosition()?.column ?? 1,
    });

    instance.onDidChangeCursorPosition((event) => {
      onCursorChange({
        lineNumber: event.position.lineNumber,
        column: event.position.column,
      });
    });
  };

  const options: editor.IStandaloneEditorConstructionOptions = {
    language: "python",
    automaticLayout: true,
    fontSize: preferences.fontSize,
    lineHeight: 24,
    tabSize: 4,
    insertSpaces: true,
    minimap: { enabled: preferences.minimapEnabled },
    scrollBeyondLastLine: false,
    wordWrap: preferences.wordWrap ? "on" : "off",
    renderLineHighlight: "all",
    roundedSelection: true,
    cursorSmoothCaretAnimation: "on",
    smoothScrolling: true,
    padding: {
      top: 16,
      bottom: 16,
    },
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    parameterHints: { enabled: false },
    fixedOverflowWidgets: true,
    overviewRulerBorder: false,
  };

  return (
    <div
      className="min-h-0 flex-1 overflow-hidden bg-[#FBFCFF]"
      aria-label="Python code editor"
    >
      <MonacoEditor
        height="100%"
        defaultLanguage="python"
        language="python"
        theme="socratic-light"
        value={value}
        beforeMount={defineSocraticTheme}
        onMount={handleMount}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        options={options}
      />
    </div>
  );
}
