import type { ProgrammingTaskDetail } from "@/types/task";
import { mockTasks } from "@/data/tasks";

const task004 = mockTasks.find((task) => task.id === "task-004");

if (!task004) {
  throw new Error("Task task-004 summary is required for task details.");
}

export const taskDetails: ProgrammingTaskDetail[] = [
  {
    ...task004,
    language: "python",
    description: [
      "Write a Python program that calculates the sum of all integers from 1 to n.",
      "The program should ask the user to enter a positive integer n, then use a loop to calculate and display the total.",
    ],
    learningObjectives: [
      "Use a loop to repeat an operation",
      "Update an accumulator variable",
      "Work with user input and integer conversion",
      "Explain how the loop produces the final result",
    ],
    inputDescription: "A positive integer n.",
    outputDescription: "The sum of all integers from 1 to n.",
    examples: [
      {
        id: "example-1",
        input: "5",
        output: "15",
      },
      {
        id: "example-2",
        input: "10",
        output: "55",
      },
    ],
    constraints: [
      "1 <= n <= 10,000",
      "n will always be an integer",
      "Use a loop rather than a built-in sum function",
    ],
    helpfulReminder:
      "Think about what value the total should have before the loop begins.",
    starterCode:
      'n = int(input("Enter a positive integer: "))\n\n' +
      "total = 0\n\n" +
      "# TODO: Use a loop to update total\n\n" +
      "print(total)\n",
    codeRuns: 3,
    tutorInteractions: 2,
    lastSaved: "2 minutes ago",
  },
];

export function getTaskDetail(taskId: string) {
  return taskDetails.find((task) => task.id === taskId);
}
