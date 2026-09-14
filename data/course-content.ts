import type { CourseModule, TaskKnowledge } from "@/types/course";
import type { ProgrammingTaskDetail } from "@/types/task";

export const beginnerTaskOrder = [
  "qb-string-formatter",
  "qb-print-two-lines",
  "qb-first-variable",
  "qb-update-variable",
  "qb-variables-input",
  "qb-integer-input",
  "qb-number-converter",
  "qb-temperature-converter",
  "qb-rectangle-summary",
  "qb-first-comparison",
  "qb-first-if",
  "qb-grade-calculator",
  "qb-first-elif",
  "qb-even-odd-counter",
  "qb-first-for-loop",
  "qb-range-count",
  "qb-first-while-loop",
  "qb-loop-sum",
  "qb-leap-year",
  "qb-multiplication-table",
  "qb-find-maximum",
  "qb-list-statistics",
  "qb-word-frequency",
  "qb-function-practice",
  "qb-validator-function",
  "qb-clamp-function",
  "qb-vowel-counter-function",
  "qb-remove-duplicates",
  "qb-second-largest",
  "qb-refactor-repeated-logic",
  "qb-inventory-summary",
  "qb-debug-checkout",
  "qb-fizzbuzz-range",
  "qb-longest-streak",
  "qb-mini-gradebook",
];

export function getTaskPracticeLevel(taskId: string) {
  const position = beginnerTaskOrder.indexOf(taskId);
  if (position < 0 || position < 6) return "Follow";
  if (position < 14) return "Apply";
  if (position < 24) return "Combine";
  return "Solve";
}

export const courseModules: CourseModule[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Read simple Python statements, comments, and printed output.",
    order: 1,
    taskIds: ["qb-string-formatter"],
  },
  {
    id: "variables-data-types",
    title: "Variables & Data Types",
    description: "Store text and numbers, convert types, and use clear variable names.",
    order: 2,
    taskIds: ["qb-temperature-converter", "qb-rectangle-summary"],
  },
  {
    id: "input-output",
    title: "Input & Output",
    description: "Read user input and produce clear, correctly formatted output.",
    order: 3,
    taskIds: ["qb-variables-input", "qb-number-converter"],
  },
  {
    id: "operators",
    title: "Operators",
    description: "Use arithmetic, comparison, and logical operators to express rules.",
    order: 4,
    taskIds: ["qb-even-odd-counter", "qb-validator-function", "qb-clamp-function"],
  },
  {
    id: "conditionals",
    title: "Conditional Statements",
    description: "Make decisions with if, elif, else, and nested conditions.",
    order: 5,
    taskIds: ["qb-grade-calculator", "qb-leap-year", "qb-debug-checkout", "qb-fizzbuzz-range"],
  },
  {
    id: "loops",
    title: "Loops",
    description: "Repeat steps with while, for, range, break, and continue.",
    order: 6,
    taskIds: ["qb-loop-sum", "qb-multiplication-table", "qb-find-maximum", "qb-longest-streak"],
  },
];

const knowledgeByTaskId: Record<string, TaskKnowledge> = {
  "qb-print-two-lines": { title: "Statement order", points: ["Each print() call displays one line.", "Python runs these statements from top to bottom."], example: "print(\"First\")\nprint(\"Second\")", reminder: "Match both lines and keep them in the requested order." },
  "qb-first-variable": { title: "A first variable", points: ["A variable is a name for a value.", "Use = to store the value on the right under the name on the left."], example: "word = \"Hello\"\nprint(word)", reminder: "Check which part is the variable name and which part is the string value." },
  "qb-update-variable": { title: "Updating a variable", points: ["The right side is calculated before assignment.", "Assigning to the same name replaces its previous value."], example: "score = 5\nscore = score + 2", reminder: "Use the current score to calculate the next score." },
  "qb-integer-input": { title: "Numeric input", points: ["input() gives you text.", "int() converts compatible text to a whole number."], example: "age = int(input())\nprint(age + 1)", reminder: "Convert the input before trying to add a number." },
  "qb-first-comparison": { title: "A first comparison", points: ["> asks whether the left number is greater.", "A comparison produces the boolean value True or False."], example: "print(8 > 3)", reminder: "Read the comparison from left to right." },
  "qb-first-if": { title: "A first if statement", points: ["An if block runs only when its condition is True.", "A colon ends the condition line and indentation marks the block."], example: "if temperature > 30:\n    print(\"Hot\")", reminder: "Only the positive case should print anything." },
  "qb-first-elif": { title: "Three possible branches", points: ["if checks the first condition.", "elif checks another condition only if the first was False.", "else handles everything remaining."], example: "if value > 0:\n    print(\"Positive\")\nelif value == 0:\n    print(\"Zero\")\nelse:\n    print(\"Negative\")", reminder: "Make sure exactly one branch runs for every integer." },
  "qb-first-for-loop": { title: "Repeating a small step", points: ["A for loop repeats its indented body.", "range(3) supplies three values: 0, 1, and 2."], example: "for count in range(3):\n    print(\"Go\")", reminder: "Put the repeated statement inside the indented loop body." },
  "qb-range-count": { title: "range boundaries", points: ["range(start, stop) includes start.", "It stops before the stop value."], example: "for number in range(1, 4):\n    print(number)", reminder: "To include 5, choose a stop value one greater than 5." },
  "qb-first-while-loop": { title: "A loop that must stop", points: ["while repeats while its condition is True.", "Changing the counter moves the loop toward stopping."], example: "number = 1\nwhile number <= 3:\n    print(number)\n    number = number + 1", reminder: "Without updating number, the condition stays True forever." },
  "qb-string-formatter": { title: "Your first print statement", points: ["Text values are strings and need matching quotes.", "print() displays the value inside its parentheses.", "Python runs simple statements from top to bottom."], example: "print(\"Hello!\")", reminder: "Check the quotes, parentheses, spaces, and punctuation against the expected output." },
  "qb-temperature-converter": { title: "Numbers and conversion", points: ["input() returns text.", "float() converts numeric text to a decimal number.", "Use variables to name intermediate values."], example: "value = float(input())\nresult = value * 2", reminder: "Convert before calculating, then format only when you print." },
  "qb-rectangle-summary": { title: "Variables and numeric expressions", points: ["A variable stores a value under a meaningful name.", "* multiplies values; parentheses control calculation order.", "One input line can be split into several values."], example: "width, height = [int(value) for value in input().split()]\narea = width * height", reminder: "Write each formula in plain words before translating it into Python." },
  "qb-variables-input": { title: "Reading one text value", points: ["input() reads one line of text.", "Store the result in a variable before using it.", "+ can join short strings together."], example: "name = input()\nprint(\"Hello, \" + name)", reminder: "First identify what is read, then construct the exact greeting." },
  "qb-number-converter": { title: "Adding numeric input", points: ["input() returns text.", "int(input()) converts that text to a whole number.", "+ adds numeric values."], example: "first = int(input())\nsecond = int(input())\nprint(first + second)", reminder: "Keep reading, calculating, and printing as three separate steps." },
  "qb-even-odd-counter": { title: "Remainders and comparisons", points: ["A number is even when its remainder after division by 2 is zero.", "== compares two values; it does not assign.", "A boolean condition can control an if statement."], example: "if number % 2 == 0:\n    print(\"Even\")", reminder: "Use == for comparison and = for assignment." },
  "qb-validator-function": { title: "Comparison and logical operators", points: ["Comparisons such as <= and >= produce True or False.", "and requires both conditions to be true.", "or requires at least one condition to be true."], example: "is_valid = minimum <= value and value <= maximum", reminder: "Turn every written requirement into a small condition before combining them." },
  "qb-clamp-function": { title: "Boundaries", points: ["Check lower and upper boundaries separately.", "elif is checked only when earlier conditions were false.", "An else branch handles all remaining values."], example: "if value < low:\n    result = low\nelif value > high:\n    result = high\nelse:\n    result = value", reminder: "Test a value below, inside, and above the allowed range." },
  "qb-grade-calculator": { title: "Choosing between two paths", points: ["if runs when its condition is True.", "else runs when that same condition is False.", ">= includes the boundary value."], example: "if score >= 60:\n    print(\"Ready\")\nelse:\n    print(\"Practice\")", reminder: "Test both 59 and the exact boundary, 60." },
  "qb-leap-year": { title: "Combining conditions", points: ["Nested rules can use and, or, and not.", "% can test divisibility.", "Parentheses make grouped conditions easier to reason about."], example: "divisible_by_4 = year % 4 == 0", reminder: "Write each rule as a named boolean before combining the rules." },
  "qb-debug-checkout": { title: "Tracing conditional code", points: ["Trace one test value through each condition.", "Boundary errors often come from < versus <=.", "An error message or wrong output is evidence about where to inspect."], example: "is_member = input() == \"yes\"\nif is_member:\n    print(\"Discount applied\")", reminder: "Change one thing at a time, then rerun the smallest failing case." },
  "qb-fizzbuzz-range": { title: "Conditions inside a loop", points: ["A loop repeats the decision for every number.", "Check the most specific combined condition first.", "range includes its start but excludes its stop."], example: "for number in range(1, 6):\n    if number % 2 == 0:\n        print(\"even\")\n    else:\n        print(number)", reminder: "Plan the branch order before writing the loop body." },
  "qb-loop-sum": { title: "Running totals", points: ["Initialize a total before the loop.", "Update it once for each relevant value.", "After each iteration, the total should represent everything processed so far."], example: "total = 0\nfor value in values:\n    total += value", reminder: "State what your accumulator means after each iteration." },
  "qb-multiplication-table": { title: "Counted loops with range()", points: ["for repeats once for each value in a sequence.", "range(start, stop) excludes stop.", "The loop variable changes automatically."], example: "for number in range(1, 11):\n    print(number)", reminder: "If you need to include 10, the range stop must be 11." },
  "qb-find-maximum": { title: "Tracking the best value", points: ["Keep a current best candidate.", "Compare every later value with that candidate.", "Initialize from real input when values might be negative."], example: "largest = numbers[0]\nfor number in numbers[1:]:\n    if number > largest:\n        largest = number", reminder: "After each loop, largest should be the greatest value seen so far." },
  "qb-longest-streak": { title: "Loop state and reset", points: ["Use one variable for the current streak and another for the best streak.", "Reset current state when the streak breaks.", "Update the best result whenever the current result improves."], example: "if value > 0:\n    current += 1\nelse:\n    current = 0", reminder: "Trace current and best values side by side on a short example." },
};

const fallbackKnowledge: Record<string, TaskKnowledge> = {
  variables: { title: "Variables", points: ["Variables give values meaningful names.", "Choose the value type that matches the job."], example: "score = 10\nprint(score)", reminder: "Write down what each variable represents." },
  conditionals: { title: "Conditional thinking", points: ["A condition produces True or False.", "Indentation groups the statements controlled by a condition."], example: "if value > 0:\n    print(\"Positive\")", reminder: "List the possible cases before coding." },
  loops: { title: "Loop thinking", points: ["A loop repeats a small step.", "Track what changes and when repetition stops."], example: "for value in values:\n    print(value)", reminder: "Describe what must be true after each iteration." },
  functions: { title: "Functions", points: ["A function gives a reusable name to a process.", "Parameters are inputs and return sends a result back."], example: "def double(value):\n    return value * 2", reminder: "Separate the function's input, process, and result." },
  lists: { title: "Lists", points: ["A list stores an ordered group of values.", "A loop can inspect each list element."], example: "values = [2, 4, 6]\nprint(values[0])", reminder: "Remember that the first list index is 0." },
  strings: { title: "Strings", points: ["A string is an ordered sequence of characters.", "You can inspect characters and build new text."], example: "word = \"Python\"\nprint(word[0])", reminder: "Treat spaces and capitalization as part of the string." },
};

export function getTaskKnowledge(task: ProgrammingTaskDetail): TaskKnowledge {
  return knowledgeByTaskId[task.id] ?? fallbackKnowledge[task.concept];
}
