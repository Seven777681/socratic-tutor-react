import assert from "node:assert/strict";
import test from "node:test";
import {
  routeAfterCodeAnalysisLayer,
  routeTutorRequest,
} from "@/lib/server/tutor-multi-agent";
import type { TutorRequest } from "@/types/tutor";

function request(overrides: Partial<TutorRequest>): TutorRequest {
  return {
    taskId: "task-1",
    studentMessage: "",
    currentCode: "",
    conversationId: "conversation-1",
    stage: "code",
    mode: "run_and_reflect",
    conversation: [],
    action: "message",
    ...overrides,
  };
}

test("routes reflection summaries directly to assessment", () => {
  assert.equal(
    routeTutorRequest(request({
      stage: "reflect",
      action: "generate_reflection_summary",
    })),
    "assessment_agent",
  );
});

test("routes planning before considering existing editor code", () => {
  assert.equal(
    routeTutorRequest(request({
      stage: "plan",
      action: "review_plan",
      currentCode: "print('starter code')",
    })),
    "problem_understanding_agent",
  );
});

test("routes run evidence to code analysis", () => {
  assert.equal(
    routeTutorRequest(request({
      stage: "debug",
      currentCode: "print(value)",
      latestRunResult: {
        id: "run-1",
        taskId: "task-1",
        status: "failed",
        scenario: "failed",
        stdin: "",
        stdout: "",
        stderr: "",
        elapsedMs: 12,
        createdAt: "2026-08-04T00:00:00.000Z",
        summary: "One test failed",
        tests: [],
      },
    })),
    "code_analysis_agent",
  );
});

test("routes an ordinary conversation turn to metacognitive monitoring", () => {
  assert.equal(
    routeTutorRequest(request({ studentMessage: "I am not sure what to try." })),
    "metacognitive_agent",
  );
});

test("routes task misunderstandings back through problem understanding", () => {
  assert.equal(
    routeAfterCodeAnalysisLayer("task_misunderstanding"),
    "problem_understanding_agent",
  );
  assert.equal(
    routeAfterCodeAnalysisLayer("implementation"),
    "metacognitive_agent",
  );
});
