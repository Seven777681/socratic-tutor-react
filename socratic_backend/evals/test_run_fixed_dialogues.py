import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

os.environ.setdefault("OPENAI_API_KEY", "test-only-placeholder")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from run_fixed_dialogues import (
    build_summary,
    count_questions,
    detected_language,
    evaluate,
    resolve_response_language,
)
from agent_services import run_learning_state_monitor_agent
from graph_nodes import code_diagnosis_agent, socratic_dialogue_agent


class FixedDialogueEvaluatorTests(unittest.TestCase):
    def test_question_counter_ignores_code_blocks(self):
        text = "Consider this code:\n```python\n# Why?\n```\nWhat changes each time?"
        self.assertEqual(count_questions(text), 1)

    def test_language_detection_preserves_python_terms(self):
        self.assertEqual(detected_language("请观察 while condition 每次什么时候改变。"), "zh")
        self.assertEqual(detected_language("Why does range stop before five?"), "en")

    def test_latest_student_language_overrides_ui(self):
        self.assertEqual(
            resolve_response_language({"ui_language": "en", "student_message": "为什么没有停止？"}),
            "zh",
        )
        self.assertEqual(
            resolve_response_language({"ui_language": "zh", "student_message": "Why did it stop?"}),
            "en",
        )

    def test_deterministic_failure_explains_area(self):
        case = {
            "input": {"current_focus": "input"},
            "expected": {
                "response_language": "zh",
                "max_questions": 1,
                "must_not_reveal_solution": True,
            },
        }
        result = evaluate(case, {"tutor_message": "Why? Why again?", "learner_state": {}})
        self.assertEqual(result["status"], "fail")
        areas = {item["area"] for item in result["checks"] if not item["passed"]}
        self.assertEqual(areas, {"language", "question_count"})

    def test_summary_points_to_code_locations(self):
        summary = build_summary(
            [{
                "id": "language-case",
                "category": "language",
                "status": "fail",
                "checks": [{"passed": False, "area": "language"}],
            }],
            {},
        )
        suggestion = summary["improvement_suggestions"][0]
        self.assertIn("server.py:_resolve_response_language", suggestion["locations"])
        self.assertTrue(suggestion["action"])

    def test_idle_help_marks_learner_stuck_and_increases_hint(self):
        with patch(
            "agent_services.base_llm_call",
            return_value='{"student_state":"beginner","is_stuck":false,"confusion_level":0}',
        ):
            result = run_learning_state_monitor_agent(
                chat_history="(no messages yet)",
                issue_type="no_error",
                current_hint_level=0,
                idle_duration_ms=60_000,
                requested_action="idle_help",
            )
        self.assertTrue(result["is_stuck"])
        self.assertEqual(result["hint_level"], 1)

    def test_code_diagnosis_preserves_internal_evidence(self):
        state = {
            "problem_content": "Print 1 through 3.",
            "student_code": "number = 1\nwhile number <= 3:\n    print(number)",
            "execution_result": "timeout",
            "agent_trace": [],
        }
        with patch(
            "graph_nodes.run_code_diagnosis_agent",
            return_value={
                "issue_type": "logical_error",
                "misconception": "loop state is not updated",
                "evidence": "number is read in the condition but never changed",
            },
        ):
            result = code_diagnosis_agent(state)
        self.assertEqual(
            result["diagnosis_evidence"],
            "number is read in the condition but never changed",
        )

    def test_socratic_dialogue_receives_diagnostic_evidence(self):
        state = {
            "response_language": "en",
            "problem_content": "Print 1 through 3.",
            "student_code": "number = 1\nwhile number <= 3:\n    print(number)",
            "messages": [],
            "stage": "debug",
            "issue_type": "logical_error",
            "misconception": "loop state is not updated",
            "diagnosis_evidence": "number is never changed in the loop body",
            "student_state": "beginner",
            "hint_level": 1,
            "action": "debug",
            "learner_state": {},
            "student_answer": "",
            "agent_trace": [],
        }
        with patch(
            "graph_nodes.socratic_dialogue_graph.invoke",
            return_value={
                "action": "ASK_CONCEPTUAL",
                "intervention_path": "A",
                "final_question": "What value changes before the condition is checked again?",
                "validation": {"valid": True, "failedRules": []},
            },
        ) as invoke:
            socratic_dialogue_agent(state)
        self.assertEqual(
            invoke.call_args.args[0]["diagnosis_evidence"],
            "number is never changed in the loop body",
        )


if __name__ == "__main__":
    unittest.main()
