import type { EditorPreferences, SaveStatus } from "@/types/task";
import type { RunScenario } from "@/types/code-run";

export type CursorPosition = {
  lineNumber: number;
  column: number;
};

export type EditorSettingsProps = {
  preferences: EditorPreferences;
  onPreferencesChange: (preferences: EditorPreferences) => void;
  demoRunScenario: RunScenario;
  onDemoRunScenarioChange: (scenario: RunScenario) => void;
};

export type SaveStatusProps = {
  saveStatus: SaveStatus;
  lastSavedLabel: string;
};
