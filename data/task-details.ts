import type { ProgrammingTaskDetail } from "@/types/task";
import { mockTasks } from "@/data/tasks";

function requireTask(taskId: string) {
  const task = mockTasks.find((candidate) => candidate.id === taskId);

  if (!task) {
    throw new Error(`Task ${taskId} summary is required for task details.`);
  }

  return task;
}

export const taskDetails: ProgrammingTaskDetail[] = [
  {
    ...requireTask("task-001"),
    language: "python",
    description: [
      "Write a Python program that asks for a user's name and age.",
      "Store both inputs in variables and print a clear, formatted greeting.",
    ],
    learningObjectives: ["Store input in variables", "Convert text input to an integer", "Format output with an f-string"],
    inputDescription: "A name followed by an age.",
    outputDescription: "A greeting containing the entered name and age.",
    examples: [{ id: "example-1", input: "Alex\n16", output: "Hello Alex! You are 16 years old." }],
    constraints: ["The name is not empty", "The age is a positive integer"],
    starterCode: 'name = input("Enter your name: ")\nage = int(input("Enter your age: "))\n\n# TODO: Print the greeting\n',
    codeRuns: 2,
    tutorInteractions: 1,
    lastSaved: "July 1",
  },
  {
    ...requireTask("task-002"),
    language: "python",
    description: [
      "Write a Python program that converts a numeric score into a letter grade.",
      "Use conditional statements to select the correct grade range.",
    ],
    learningObjectives: ["Write if, elif, and else branches", "Compare numeric values", "Order conditions correctly"],
    inputDescription: "An integer score from 0 to 100.",
    outputDescription: "The corresponding letter grade.",
    examples: [{ id: "example-1", input: "85", output: "B" }],
    constraints: ["0 <= score <= 100", "The score is an integer"],
    starterCode: 'score = int(input("Enter a score: "))\n\n# TODO: Print the matching letter grade\n',
    codeRuns: 4,
    tutorInteractions: 2,
    lastSaved: "July 2",
  },
  {
    ...requireTask("task-003"),
    language: "python",
    description: [
      "Write a Python program that calculates the sum of all integers from 1 to n.",
      "The program should ask the user to enter a positive integer n, then use a loop to calculate and display the total.",
    ],
    learningObjectives: ["Use a loop to repeat an operation", "Update an accumulator variable", "Work with user input and integer conversion", "Explain how the loop produces the final result"],
    inputDescription: "A positive integer n.",
    outputDescription: "The sum of all integers from 1 to n.",
    examples: [
      { id: "example-1", input: "5", output: "15" },
      { id: "example-2", input: "10", output: "55" },
    ],
    constraints: ["1 <= n <= 10,000", "n will always be an integer", "Use a loop rather than a built-in sum function"],
    helpfulReminder: "Think about what value the total should have before the loop begins.",
    starterCode: 'n = int(input("Enter a positive integer: "))\n\ntotal = 0\n\n# TODO: Use a loop to update total\n\nprint(total)\n',
    codeRuns: 3,
    tutorInteractions: 2,
    lastSaved: "2 minutes ago",
  },
];

export function getTaskDetail(taskId: string) {
  return taskDetails.find((task) => task.id === taskId);
}
