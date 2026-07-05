import { mockRunResultTemplates } from "@/data/mock-run-results";
import type {
  CodeRunResult,
  MockRunCodeInput,
  RunScenario,
} from "@/types/code-run";

const MOCK_DELAY_MS = 900;

function waitForMockDelay() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, MOCK_DELAY_MS);
  });
}

function buildRunId() {
  return `mock-run-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

function normalizeScenario(scenario: RunScenario) {
  return scenario in mockRunResultTemplates ? scenario : "failed";
}

export async function mockRunCode({
  taskId,
  code,
  stdin,
  scenario,
}: MockRunCodeInput): Promise<CodeRunResult> {
  await waitForMockDelay();

  const selectedScenario = normalizeScenario(scenario);
  const template = mockRunResultTemplates[selectedScenario];
  const elapsedMs = selectedScenario === "timeout" ? 5000 : 874 + (code.length % 157);

  return {
    ...template,
    id: buildRunId(),
    taskId,
    scenario: selectedScenario,
    stdin,
    elapsedMs,
    createdAt: new Date().toISOString(),
    tests: template.tests.map((test) => ({ ...test })),
    error: template.error ? { ...template.error } : undefined,
  };
}
