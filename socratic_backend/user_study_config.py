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
        },
    },
    "task_2_above_average": {
        "incorrect_divisor": {
            "category": "logical_error", "trigger": "average uses the wrong divisor",
            "planning_goal": "connect the divisor to the number of contributing values",
            "coding_goal": "derive the divisor from the input size",
        },
    },
    "task_3_remove_duplicates": {
        "append_every_value": {
            "category": "logical_error", "trigger": "every item is appended",
            "planning_goal": "state the condition for adding an item",
            "coding_goal": "check prior membership before appending",
        },
    },
    "task_4_second_largest": {
        "lost_previous_largest": {
            "category": "logical_error", "trigger": "new maximum overwrites the old maximum",
            "planning_goal": "identify why the previous maximum must be preserved",
            "coding_goal": "update both tracked values in a safe order",
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
