import json
import re
from typing import Any, Dict, List, Literal, TypedDict

from langgraph.graph import END, START, StateGraph

from llm_base import base_llm_call


PedagogicalAction = Literal[
    "ASK_METACOGNITIVE",
    "ASK_CONCEPTUAL",
    "ASK_TECHNICAL",
    "PROVIDE_EXAMPLE",
    "ALLOW_NEXT_STEP",
    "SUMMARIZE_RULE",
    "PROVIDE_PSEUDOCODE",
]

InterventionPath = Literal["A", "B", "C", "D", "FALLBACK"]


class Agent2State(TypedDict, total=False):
    problem: str
    student_code: str
    conversation_history: List[Dict[str, Any]]
    stage: str
    issue_type: str
    misconception: str
    student_state: str
    hint_level: int
    action: PedagogicalAction
    requested_action: str
    fixed_question: str
    intervention_path: InterventionPath
    final_question: str
    learner_state: Dict[str, Any]
    student_answer: str
    validation: Dict[str, Any]
    retry_count: int


def _history_text(history: List[Dict[str, Any]]) -> str:
    if not history:
        return "(no previous conversation)"
    return "\n".join(
        f"{item.get('role', 'unknown')}: {item.get('content', '')}"
        for item in history[-12:]
    )


def select_question_strategy_node(
    state: Agent2State,
) -> Dict[str, Any]:
    hint_level = max(0, min(3, int(state.get("hint_level", 0))))
    learner_state = state.get("learner_state", {})
    latest_answer = learner_state.get("latestAnswer", {})
    attempts = int(learner_state.get("attemptsOnFocus", 0) or 0)
    off_target = int(learner_state.get("consecutiveOffTarget", 0) or 0)
    quality = str(latest_answer.get("quality", "uncertain"))
    focus_resolved = bool(latest_answer.get("focusResolved", False))
    has_misconception = bool(
        latest_answer.get("misconception") or state.get("misconception")
    )

    if attempts > 3:
        path: InterventionPath = "FALLBACK"
        action: PedagogicalAction = "PROVIDE_PSEUDOCODE"
    elif state.get("requested_action") == "smaller_hint":
        path = "C"
        if hint_level <= 1:
            action = "ASK_CONCEPTUAL"
        elif hint_level == 2:
            action = "ASK_TECHNICAL"
        else:
            action = "PROVIDE_EXAMPLE"
    elif quality == "correct" and focus_resolved:
        path = "D"
        action = "SUMMARIZE_RULE"
    elif off_target >= 2 or hint_level >= 2 or state.get("student_state") == "confused":
        path = "C"
        action = "ASK_TECHNICAL"
    elif quality == "partial" or has_misconception:
        path = "B"
        action = "PROVIDE_EXAMPLE"
    else:
        path = "A"
        action = "ASK_METACOGNITIVE"
    return {"action": action, "intervention_path": path}


def _clean_question(text: str) -> str:
    text = text.strip().strip('"')
    if text.lower().startswith("question:"):
        text = text.split(":", 1)[1].strip()
    first_question = re.search(r".*?\?", text, re.DOTALL)
    if first_question:
        return " ".join(first_question.group(0).split())
    return "What do you expect this part of your reasoning to accomplish?"


def _question_core(text: str) -> str:
    """Remove acknowledgements so paraphrased wrappers cannot hide repetition."""
    normalized = " ".join(text.lower().split())
    question_clauses = re.findall(
        r"(?:what|how|why|when|where|which|should|could|would|can|do|does)\b[^?]*\?",
        normalized,
    )
    return question_clauses[-1] if question_clauses else normalized


def _question_similarity(left: str, right: str) -> float:
    stop_words = {
        "a", "an", "the", "is", "are", "to", "of", "in", "it", "your",
        "you", "and", "after", "before", "should", "could", "would", "do",
        "does", "what", "how", "when", "where", "which", "program",
    }

    def tokens(value: str) -> set[str]:
        return {
            token
            for token in re.findall(r"[a-z0-9_]+", _question_core(value))
            if token not in stop_words
        }

    left_tokens = tokens(left)
    right_tokens = tokens(right)
    if not left_tokens or not right_tokens:
        return 0.0
    return len(left_tokens & right_tokens) / len(left_tokens | right_tokens)


def _is_repeated_question(question: str, previous_questions: List[str]) -> bool:
    core = _question_core(question)
    return any(
        core == _question_core(previous)
        or _question_similarity(question, previous) >= 0.68
        for previous in previous_questions
    )


def _question_intent(text: str) -> str:
    """Classify common tutoring intents that lexical overlap can miss."""
    normalized = " ".join(text.lower().split())
    intent_terms = {
        "output": (
            "produce", "print", "display", "show", "final result",
            "end up", "when it finishes", "after processing",
        ),
        "input": ("receive", "given", "available at the start", "input data"),
        "algorithm": (
            "each value", "each number", "one by one", "keep track",
            "update", "compare", "next step",
        ),
        "plan_submission": ("plan section", "record your plan", "write your plan"),
    }
    for intent, terms in intent_terms.items():
        if any(term in normalized for term in terms):
            return intent
    return ""


def generate_socratic_question_node(state: Agent2State) -> Dict[str, str]:
    if state.get("fixed_question"):
        return {"final_question": state["fixed_question"]}
    learner_state = state.get("learner_state", {})
    latest_answer = learner_state.get("latestAnswer", {})
    validation_feedback = state.get("validation", {}).get("failedRules", [])
    current_focus = (
        state.get("issue_type", "logical_error")
        if state.get("stage") == "debug"
        else learner_state.get("currentFocus", state.get("issue_type", "unknown"))
    )
    focus_instruction = {
        "problem_goal": "Ask only about the program's final goal, not its input or algorithm.",
        "input": "Ask only what data the program receives, not its output or algorithm.",
        "output": "Ask only what the program should produce, not its input or algorithm.",
        "algorithm": "Ask about one next reasoning step in the process, without supplying it.",
        "plan_submission": "Ask the student to summarize their own established reasoning in the Plan section.",
        "coding_progress": "Ask about the student's current coding intention, expectation, or next small step. Never send them back to the Plan section.",
        "reflection_learning": "Ask the student to explain one lesson, tradeoff, or transferable idea from the completed solution.",
        "syntax_error": "Ask what language rule the interpreter may be rejecting, without naming the exact line or correction.",
        "logical_error": "Ask the student to compare expected behavior with the relevant variable or condition behavior.",
        "conceptual_error": "Ask about the programming concept or assumption behind the observed error.",
        "algorithm_error": "Ask where the implemented process first differs from the intended behavior.",
    }.get(current_focus, "Target exactly one missing idea.")

    prompt = f"""
You are Agent 2, the Socratic Questioning Agent and the only student-facing
question generator.

Stage: {state.get('stage', 'coding')}
Diagnosis from Agent 1 or Agent 3:
- issue_type: {state.get('issue_type', 'none')}
- misconception: {state.get('misconception', 'none')}
Learner state from Agent 4:
- student_state: {state.get('student_state', 'beginner')}
- hint_level: {state.get('hint_level', 0)}
Selected strategy: {state.get('action', 'ASK_METACOGNITIVE')}
Student-requested action: {state.get('requested_action', 'message')}
Intervention path: {state.get('intervention_path', 'A')}
Current learning focus: {current_focus}
Focus-specific constraint: {focus_instruction}
Latest answer quality: {latest_answer.get('quality', 'uncertain')}
Ideas the student already expressed correctly: {latest_answer.get('recognizedIdeas', [])}
Ideas still missing: {latest_answer.get('missingIdeas', [])}
Possible misconception: {latest_answer.get('misconception', '')}
Attempts on this focus: {learner_state.get('attemptsOnFocus', 0)}
Previous validation failures to fix: {validation_feedback}

Strategy rules:
- ASK_METACOGNITIVE: ask the student to inspect their expectation or assumption.
- ASK_CONCEPTUAL: guide recall of a concept without naming syntax.
- ASK_TECHNICAL: mention a relevant structure or language feature, but no code.
- PROVIDE_EXAMPLE: place one tiny analogous, non-solution example inside a question.
- ALLOW_NEXT_STEP: ask the student to explain or try their next step.
- SUMMARIZE_RULE: state one general rule abstracted from the student's correct
  reasoning, then ask one short transfer question.
- PROVIDE_PSEUDOCODE: give a language-neutral outline of two to four conceptual
  steps, then ask the student to explain why it works. Do not use code fences,
  executable syntax, exact identifiers, or a complete task-specific answer.
- If issue_type is REQUEST_PLAN, ask the student to summarize the reasoning they
  developed in the Plan section before coding.
- In debugging, use Agent 3's issue_type and misconception as the sole diagnostic
  focus. Never ask about writing, reviewing, or translating the Plan.
- For a student-requested smaller_hint, make level 1 conceptual and broad, level 2
  focused on the relevant structure, and level 3 a tiny analogous example. Use the
  learner's current code and misconception to choose the focus, but never reveal the
  finished answer.

Return one or two concise sentences containing exactly one question mark. Normal
paths should output only the question. SUMMARIZE_RULE may prefix its question with
one general rule; PROVIDE_PSEUDOCODE may prefix its question with one abstract
reasoning outline. Never provide corrected code, a complete plan, or the exact bug
location. Respond to the latest
student answer and do not repeat a question already present in the conversation.
Briefly acknowledge a correct idea from the latest answer inside the question when
natural, then target exactly one missing idea. Do not praise an incorrect answer.
"""
    user_content = (
        f"Problem:\n{state.get('problem', '')}\n\n"
        f"Student code:\n{state.get('student_code', '') or '(no code yet)'}\n\n"
        f"Latest student answer:\n{state.get('student_answer', '') or '(none)'}\n\n"
        f"Conversation:\n{_history_text(state.get('conversation_history', []))}"
    )
    return {"final_question": _clean_question(base_llm_call(prompt, user_content))}


def validate_question_node(state: Agent2State) -> Dict[str, Any]:
    question = state.get("final_question", "").strip()
    if state.get("fixed_question") and question == state.get("fixed_question"):
        return {
            "validation": {"valid": question.count("?") == 1, "failedRules": []},
            "retry_count": 0,
        }
    history = _history_text(state.get("conversation_history", []))
    learner_state = state.get("learner_state", {})
    prompt = """
You validate one Socratic tutoring intervention. Return only valid JSON:
{
  "valid": true,
  "failedRules": ["single_question|targets_focus|uses_student_context|reveals_answer|repeated|hint_mismatch|unclear"]
}

The intervention must contain exactly one question mark, target the current learning
focus, respond to the student's latest reasoning, not repeat prior questions, and
match the selected strategy. SUMMARIZE_RULE may include one general principle before
the question. PROVIDE_PSEUDOCODE may include a short language-neutral reasoning
outline, but never executable or corrected code. Do not output chain-of-thought.
"""
    user_content = (
        f"Candidate question: {question}\n"
        f"Selected strategy: {state.get('action')}\n"
        f"Intervention path: {state.get('intervention_path')}\n"
        f"Stage: {state.get('stage')}\n"
        f"Current focus: {learner_state.get('currentFocus', state.get('issue_type'))}\n"
        f"Hint level: {state.get('hint_level', 0)}\n"
        f"Latest answer: {learner_state.get('latestAnswer', {})}\n"
        f"Conversation history:\n{history}"
    )
    response = base_llm_call(prompt, user_content)
    match = re.search(r"\{.*\}", response, re.DOTALL)
    parsed = {}
    if match:
        try:
            parsed = json.loads(match.group(0))
        except json.JSONDecodeError:
            parsed = {}

    failed_rules = [str(item) for item in parsed.get("failedRules", [])]
    if question.count("?") != 1:
        failed_rules.append("single_question")
    if re.search(r"\band what\b", question, re.IGNORECASE):
        failed_rules.append("single_question")
    if not question or len(question) > 320:
        failed_rules.append("unclear")
    lower_question = " ".join(question.lower().split())
    previous_questions = [
        str(item.get("content", ""))
        for item in state.get("conversation_history", [])
        if item.get("role") == "tutor"
    ]
    if _is_repeated_question(question, previous_questions):
        failed_rules.append("repeated")
    candidate_intent = _question_intent(question)
    if candidate_intent and any(
        _question_intent(previous) == candidate_intent
        for previous in previous_questions[-2:]
    ):
        failed_rules.append("repeated")
    if "```" in question or "the correct solution is" in lower_question:
        failed_rules.append("reveals_answer")
    if state.get("stage") == "debug" and any(
        phrase in lower_question
        for phrase in ("your plan", "plan section", "translating into code", "before coding")
    ):
        failed_rules.append("targets_focus")

    focus = learner_state.get("currentFocus", "")
    forbidden_by_focus = {
        "problem_goal": ("input", "step by step", "compare", "keep track"),
        "input": ("output", "produce", "step by step", "compare", "keep track"),
        "output": ("input", "step by step", "compare", "keep track"),
        "algorithm": ("write the code", "correct solution"),
        "plan_submission": ("start coding now",),
    }
    if any(term in lower_question for term in forbidden_by_focus.get(focus, ())):
        failed_rules.append("targets_focus")

    failed_rules = list(dict.fromkeys(failed_rules))
    valid = bool(parsed.get("valid", False)) and not failed_rules
    retry_count = int(state.get("retry_count", 0)) + (0 if valid else 1)
    return {
        "validation": {"valid": valid, "failedRules": failed_rules},
        "retry_count": retry_count,
    }


def route_after_validation(state: Agent2State):
    if state.get("validation", {}).get("valid", False):
        return END
    if state.get("retry_count", 0) <= 1:
        return "generate_socratic_question"
    return "safe_fallback_question"


def safe_fallback_question_node(state: Agent2State) -> Dict[str, str]:
    learner_state = state.get("learner_state", {})
    latest = learner_state.get("latestAnswer", {})
    recognized = latest.get("recognizedIdeas", [])
    prefix = f"You identified {recognized[0]}. " if recognized else ""
    focus = (
        state.get("issue_type", "logical_error")
        if state.get("stage") == "debug"
        else learner_state.get("currentFocus", "problem_goal")
    )
    action = state.get("action", "ASK_METACOGNITIVE")
    if action == "PROVIDE_PSEUDOCODE":
        outlines = {
            "syntax_error": "Use this checking outline: isolate one statement, compare its structure with the language rule, change one structural element, then rerun. How would you apply these steps to the current error?",
            "logical_error": "Use this reasoning outline: identify the state to preserve, process one item at a time, update only when the target condition holds, then inspect the final state. Why should that preserve the intended result?",
            "algorithm_error": "Use this reasoning outline: define the required state, process one input unit, update the state under a precise condition, then repeat to completion. Why does each step move toward the required result?",
        }
        return {
            "final_question": outlines.get(
                focus,
                "Use this reasoning outline: identify the required information, describe one transformation at a time, then check the result against the task. How does each step address the current gap?",
            )
        }
    if action == "SUMMARIZE_RULE":
        idea = recognized[0] if recognized else "the reasoning you just established"
        return {
            "final_question": f"Your answer establishes this reusable idea: {idea}. Where could the same principle apply in a similar problem?"
        }
    questions = {
        "problem_goal": [
            "What single result should the finished program produce?",
            "How would you describe the program's goal in your own words?",
            "When the program finishes, what should it have accomplished?",
        ],
        "input": [
            "What data will the program receive before it begins processing?",
            "How would you describe the information given to the program?",
            "What values are available to the program at the start?",
        ],
        "output": [
            "What value should the program produce after processing is complete?",
            "What should the user see when the program finishes?",
            "How would you describe the expected final result?",
        ],
        "algorithm": [
            "What decision should the program make as it examines each value?",
            "How could the program use each value to move closer to the result?",
            "What should change while the program processes the values one by one?",
        ],
        "plan_submission": [
            "How would you summarize your reasoning in the Plan section before coding?",
            "What approach and steps will you now record in the Plan section?",
            "How can you turn the reasoning you developed into a short written Plan?",
        ],
        "coding_progress": [
            "What part of your plan are you translating into code right now?",
            "What do you expect the next part of your code to accomplish?",
            "Which step are you trying to express in the program at the moment?",
        ],
        "reflection_learning": [
            "What is one idea from this solution that you could reuse in a similar problem?",
            "Why did your final approach work for this problem?",
            "What would you do differently if you solved a similar problem again?",
        ],
        "syntax_error": [
            "What Python syntax rule might the interpreter be rejecting here?",
            "Which expression would you inspect first for invalid Python structure?",
            "How could you check whether each statement follows Python's required form?",
        ],
        "logical_error": [
            "What value do you expect the relevant variable to hold when the result first becomes incorrect?",
            "Which assumption in the current logic would you test against the failing result?",
            "Where does the observed behavior first differ from what you expected?",
        ],
        "conceptual_error": [
            "What does the operation involved in this error expect from the values it receives?",
            "Which programming concept could explain why this operation behaves differently than expected?",
            "What assumption are you making about the value or name involved in the error?",
        ],
        "algorithm_error": [
            "At which step does the program's behavior first differ from your intended process?",
            "Which part of the overall procedure would you test with a small example first?",
            "What invariant should remain true while your algorithm processes each value?",
        ],
    }
    previous_questions = [
        str(item.get("content", ""))
        for item in state.get("conversation_history", [])
        if item.get("role") == "tutor"
    ]
    candidates = questions.get(focus, ["What part of your reasoning would you examine next?"])
    unused_candidates = [
        candidate
        for candidate in candidates
        if not _is_repeated_question(candidate, previous_questions)
    ]
    pool = unused_candidates or candidates
    selected = min(
        pool,
        key=lambda candidate: max(
            (_question_similarity(candidate, previous) for previous in previous_questions),
            default=0.0,
        ),
    )
    return {"final_question": prefix + selected}


builder = StateGraph(Agent2State)
builder.add_node("select_question_strategy", select_question_strategy_node)
builder.add_node("generate_socratic_question", generate_socratic_question_node)
builder.add_node("validate_question", validate_question_node)
builder.add_node("safe_fallback_question", safe_fallback_question_node)
builder.add_edge(START, "select_question_strategy")
builder.add_edge("select_question_strategy", "generate_socratic_question")
builder.add_edge("generate_socratic_question", "validate_question")
builder.add_conditional_edges("validate_question", route_after_validation)
builder.add_edge("safe_fallback_question", END)

agent2_graph = builder.compile()
