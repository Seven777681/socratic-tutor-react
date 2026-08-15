"""Fixed, versioned pedagogical policy for the formal user study."""

STUDY_TASK_IDS = {
    "task_1_maximum", "task_2_above_average",
    "task_3_remove_duplicates", "task_4_second_largest",
}

INTERVENTION_CATEGORIES = {
    "planning_misconception",
    "conceptual_misconception",
    "logical_error",
    "syntax_error",
    "constraint_violation",
    "no_meaningful_problem",
}

INTERVENTIONS = {
    "task_1_maximum": {
        "initialized_to_zero": {
            "category": "conceptual_misconception",
            "trigger": "largest is initialized to zero",
            "planning_goal": "surface the assumption behind initialization",
            "coding_goal": "reason about all-negative input",
            "levels": [
                "What does the initial `largest` value represent?",
                "Does choosing 0 assume something about the values that may appear in the list?",
                "Could the initial value be based on information already present in the input?",
                "Trace your code using [-8, -3, -10]. What value does `largest` have after each comparison?",
            ],
        },
    },
    "task_2_above_average": {
        "incorrect_divisor": {
            "category": "logical_error", "trigger": "average uses the wrong divisor",
            "planning_goal": "connect the divisor to the number of contributing values",
            "coding_goal": "derive the divisor from the input size",
            "levels": [
                "What does `total` represent after the first loop?",
                "What determines how many values contributed to that total?",
                "What information from the list tells you how many values were included?",
                "With [2, 4, 6, 8], the total is 20. How many values produced that total?",
            ],
        },
    },
    "task_3_remove_duplicates": {
        "append_every_value": {
            "category": "logical_error", "trigger": "every item is appended",
            "planning_goal": "state the condition for adding an item",
            "coding_goal": "check prior membership before appending",
            "levels": [
                "What should be true before a value is added to the result?",
                "How can you tell whether the current value has already appeared in your result?",
                "Consider checking the current value against the values already stored in the result. What should that check decide?",
                "For [3, 1, 3], trace the result after each item. Should the second 3 be added?",
            ],
        },
    },
    "task_4_second_largest": {
        "lost_previous_largest": {
            "category": "logical_error", "trigger": "new maximum overwrites the old maximum",
            "planning_goal": "identify why the previous maximum must be preserved",
            "coding_goal": "update both tracked values in a safe order",
            "levels": [
                "When you find a new largest value, what happens to the previous largest value?",
                "Could the previous largest still be important for the final answer?",
                "How should both tracked states change when a new maximum appears?",
                "Trace [4, 7, 2, 9]. When 9 becomes the new largest, which value should still be remembered?",
            ],
        },
    },
}

MAX_PLANNING_QUESTIONS = 2
MAX_QUESTIONS_PER_ISSUE = 2


def get_intervention(task_id: str, misconception: str):
    task_rules = INTERVENTIONS.get(task_id, {})
    normalized = (misconception or "").lower().replace(" ", "_")
    for misconception_id, rule in task_rules.items():
        if misconception_id in normalized or normalized in misconception_id:
            return misconception_id, rule
    return None, None
