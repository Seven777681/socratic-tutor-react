import { mockRunResultTemplates } from "@/data/mock-run-results";
import type {
  CodeRunResult,
  TestCaseResult,
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

function getTaskRunFeedback(
  taskId: string,
  scenario: RunScenario,
): Pick<CodeRunResult, "stdout" | "summary" | "tests" | "error"> | undefined {
  if (taskId !== "qb-variables-input") {
    return undefined;
  }

  if (scenario === "success") {
    const tests: TestCaseResult[] = [
      {
        id: "public-1",
        name: "Greeting with name and age",
        visibility: "public",
        input: "Maya\n12",
        expectedOutput: "Hello Maya, you are 12 years old.",
        actualOutput: "Hello Maya, you are 12 years old.",
        passed: true,
        feedback: "The greeting includes both the name and age in the expected format.",
      },
      {
        id: "public-2",
        name: "Different user input",
        visibility: "public",
        input: "Leo\n9",
        expectedOutput: "Hello Leo, you are 9 years old.",
        actualOutput: "Hello Leo, you are 9 years old.",
        passed: true,
        feedback: "The program works with another name and age.",
      },
    ];

    return {
      stdout: "Enter your name: Maya\nEnter your age: 12\nHello Maya, you are 12 years old.",
      summary:
        "Nice work. The program used the provided name and age in the greeting.",
      tests,
    };
  }

  if (scenario === "failed") {
    const tests: TestCaseResult[] = [
      {
        id: "public-1",
        name: "Greeting with name and age",
        visibility: "public",
        input: "Maya\n12",
        expectedOutput: "Hello Maya, you are 12 years old.",
        actualOutput: "Hello Maya!",
        passed: false,
        feedback:
          "The greeting should include both the name and the age in the printed message.",
      },
      {
        id: "public-2",
        name: "Prompt-independent formatting",
        visibility: "public",
        input: "Leo\n9",
        expectedOutput: "Hello Leo, you are 9 years old.",
        actualOutput: "Hello Leo!",
        passed: false,
        feedback:
          "Check whether your output format matches the expected sentence exactly.",
      },
    ];

    return {
      stdout: "Enter your name: Maya\nEnter your age: 12\nHello Maya!",
      summary:
        "The program ran, but the greeting output did not match the expected format. Check whether you used both the name and age in your printed message.",
      tests,
    };
  }

  if (scenario === "runtime_error") {
    return {
      stdout: "Enter your name: Maya",
      summary:
        "The code started running, then stopped while reading or using the username input.",
      tests: [],
      error: {
        type: "runtime",
        title: "Runtime Error",
        message: "A value was used before it was assigned.",
        lineNumber: 3,
        hint: "Check the variable names you use for the name and age inputs.",
      },
    };
  }

  return undefined;
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
  const taskFeedback = getTaskRunFeedback(taskId, selectedScenario);
  const elapsedMs = selectedScenario === "timeout" ? 5000 : 874 + (code.length % 157);

  return {
    ...template,
    ...taskFeedback,
    id: buildRunId(),
    taskId,
    scenario: selectedScenario,
    stdin,
    elapsedMs,
    createdAt: new Date().toISOString(),
    tests: (taskFeedback?.tests ?? template.tests).map((test) => ({ ...test })),
    error: taskFeedback?.error
      ? { ...taskFeedback.error }
      : template.error
        ? { ...template.error }
        : undefined,
  };
}
