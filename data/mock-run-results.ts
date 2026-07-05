import type { CodeRunResult, RunScenario } from "@/types/code-run";

type RunResultTemplate = Omit<
  CodeRunResult,
  "id" | "taskId" | "stdin" | "elapsedMs" | "createdAt" | "scenario"
>;

export const mockRunResultTemplates: Record<RunScenario, RunResultTemplate> = {
  success: {
    status: "success",
    stdout: "Enter a positive integer: 5\n15",
    stderr: "",
    summary:
      "Nice work. The program produced the expected result for the available checks.",
    tests: [
      {
        id: "public-1",
        name: "Public Test 1",
        visibility: "public",
        input: "5",
        expectedOutput: "15",
        actualOutput: "15",
        passed: true,
        feedback: "The output matches the expected sum.",
      },
      {
        id: "public-2",
        name: "Public Test 2",
        visibility: "public",
        input: "1",
        expectedOutput: "1",
        actualOutput: "1",
        passed: true,
        feedback: "The program handles the smallest public case.",
      },
      {
        id: "hidden-1",
        name: "Hidden Test 1",
        visibility: "hidden",
        passed: true,
        feedback: "A hidden case passed.",
      },
      {
        id: "hidden-2",
        name: "Hidden Test 2",
        visibility: "hidden",
        passed: true,
        feedback: "A hidden case passed.",
      },
    ],
  },
  failed: {
    status: "failed",
    stdout: "Enter a positive integer: 5\n0",
    stderr: "",
    summary:
      "The program ran, but some checks did not pass yet. Look at how the total changes before printing it.",
    tests: [
      {
        id: "public-1",
        name: "Public Test 1",
        visibility: "public",
        input: "5",
        expectedOutput: "15",
        actualOutput: "0",
        passed: false,
        feedback: "The output should be the sum from 1 to 5.",
      },
      {
        id: "public-2",
        name: "Public Test 2",
        visibility: "public",
        input: "1",
        expectedOutput: "1",
        actualOutput: "0",
        passed: false,
        feedback: "Check whether the loop updates the accumulator.",
      },
      {
        id: "hidden-1",
        name: "Hidden Test 1",
        visibility: "hidden",
        passed: false,
        feedback:
          "A hidden case failed. Revisit the general loop logic instead of tuning for one input.",
      },
      {
        id: "hidden-2",
        name: "Hidden Test 2",
        visibility: "hidden",
        passed: false,
        feedback:
          "A hidden case failed. Make sure the same approach works for different positive integers.",
      },
    ],
  },
  syntax_error: {
    status: "error",
    stdout: "",
    stderr: "SyntaxError: expected ':'",
    summary:
      "Python could not understand the code structure yet. Check the line shown below.",
    tests: [],
    error: {
      type: "syntax",
      title: "Syntax Error",
      message: "Expected ':' after the loop header.",
      lineNumber: 4,
      hint: "Look for a statement that begins a block and needs punctuation at the end.",
    },
  },
  runtime_error: {
    status: "error",
    stdout: "Enter a positive integer: 5",
    stderr: "NameError: name 'totl' is not defined",
    summary:
      "The code started running, then stopped because Python found a runtime issue.",
    tests: [],
    error: {
      type: "runtime",
      title: "Runtime Error",
      message: "A variable name was used before it had a value.",
      lineNumber: 7,
      hint: "Compare the spelling of the variable where it is created and where it is updated.",
    },
  },
  timeout: {
    status: "timeout",
    stdout: "Enter a positive integer: 5",
    stderr: "Execution timed out after 5 seconds.",
    summary:
      "The mock run timed out. Think about whether the loop condition eventually becomes false.",
    tests: [],
    error: {
      type: "timeout",
      title: "Time Limit Exceeded",
      message: "The program took too long to finish.",
      hint: "Check that each loop iteration moves toward stopping.",
    },
  },
  system_error: {
    status: "system_error",
    stdout: "",
    stderr: "Mock runner unavailable.",
    summary:
      "The mock runner could not return a normal result. Your code was not executed.",
    tests: [],
    error: {
      type: "system",
      title: "System Error",
      message: "The mock run service returned an internal error.",
      hint: "Try again in a moment. This is not feedback about your code.",
    },
  },
};
