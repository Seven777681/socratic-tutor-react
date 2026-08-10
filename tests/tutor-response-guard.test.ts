import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateTutorResponse,
  questionSimilarity,
} from "@/lib/server/tutor-response-guard";

test("accepts one non-repeated question inside the hint boundary", () => {
  const result = evaluateTutorResponse({
    candidate: {
      primaryQuestion: "What should the first step accomplish?",
      optionalPrompt: "Focus on the input before thinking about syntax.",
      supportType: "concept",
      questionType: "decomposition",
    },
    hintLevel: 1,
    recentTutorQuestions: [],
  });

  assert.equal(result.safe, true);
  assert.deepEqual(result.violations, []);
});

test("rejects multiple questions and a second optional question", () => {
  const result = evaluateTutorResponse({
    candidate: {
      primaryQuestion: "What is the input? What is the output?",
      optionalPrompt: "Can you test both?",
      supportType: "metacognitive",
      questionType: "understanding",
    },
    hintLevel: 0,
    recentTutorQuestions: [],
  });

  assert.ok(result.violations.includes("missing_single_question"));
  assert.ok(result.violations.includes("optional_prompt_contains_question"));
});

test("rejects code leakage, direct answers, and support above the hint level", () => {
  const result = evaluateTutorResponse({
    candidate: {
      primaryQuestion: "Why not use this code?",
      optionalPrompt: "The answer is:\n```python\nvalue = 3\n```",
      supportType: "syntax_direction",
      questionType: "debugging",
    },
    hintLevel: 1,
    recentTutorQuestions: [],
  });

  assert.ok(result.violations.includes("possible_code_leakage"));
  assert.ok(result.violations.includes("possible_direct_answer"));
  assert.ok(result.violations.includes("hint_level_exceeded"));
});

test("rejects a question that closely repeats a recent tutor question", () => {
  const prior = "After the first loop step, what value should total contain?";
  const current = "After the first loop step, what value should total contain?";
  const result = evaluateTutorResponse({
    candidate: {
      primaryQuestion: current,
      optionalPrompt: "",
      supportType: "metacognitive",
      questionType: "debugging",
    },
    hintLevel: 0,
    recentTutorQuestions: [prior],
  });

  assert.equal(questionSimilarity(prior, current), 1);
  assert.ok(result.violations.includes("repeated_question"));
});

test("recognizes closely repeated Chinese questions", () => {
  assert.ok(
    questionSimilarity(
      "第一次循环结束后，变量 total 的值应该是什么？",
      "第一次循环结束后，变量 total 的值应该是什么？",
    ) >= 0.72,
  );
});
