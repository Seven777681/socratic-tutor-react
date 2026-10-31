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
    intervention_guidance: Dict[str, Any]
    intervention_path: InterventionPath
    final_question: str
    response_language: str
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
    first_question = re.search(r".*?[？?]", text, re.DOTALL)
    if first_question:
        return " ".join(first_question.group(0).split())
    return "你希望这部分思路完成什么任务？"


def _question_mark_count(text: str) -> int:
    return text.count("?") + text.count("？")


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
        or " ".join(question.split()) in " ".join(previous.split())
        or " ".join(previous.split()) in " ".join(question.split())
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
    learner_state = state.get("learner_state", {})
    latest_answer = learner_state.get("latestAnswer", {})
    validation_feedback = state.get("validation", {}).get("failedRules", [])
    intervention_guidance = state.get("intervention_guidance", {})
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
    }.get(
        current_focus,
        "Use the code, execution evidence, and latest student message to choose one missing idea without relying on an error-type question template."
        if state.get("stage") == "debug"
        else "Target exactly one missing idea.",
    )

    response_language = state.get("response_language", "en")
    language_requirement = (
        "Always respond in natural, concise Simplified Chinese."
        if response_language == "zh"
        else "Always respond in natural, concise English."
    )
    prompt = f"""
You are Agent 2, the Socratic Questioning Agent and the only student-facing
question generator.

Language requirement: {language_requirement}
Keep Python identifiers, code, input examples, and error messages unchanged.

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
Internal intervention guidance: {intervention_guidance}

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
- Treat Internal intervention guidance as teaching intent, not student-facing copy.
  Never repeat its suggested wording verbatim. First interpret what the student's
  latest message means in context, then write a fresh response that directly
  addresses that meaning and advances only one small step.
- If the student asks how to express an idea in Python, acknowledge that concrete
  request and guide the relevant language concept instead of repeating the prior
  conceptual question.
- Vary the conversational move according to context: ask for a prediction, request
  a concrete trace, contrast two possibilities, ask for a reason, or ask for the
  next small action. Do not use the same rhetorical frame in consecutive turns.
- Do not routinely summarize, praise, or paraphrase the student's answer before
  asking the question. Prefer a direct question when the context is already clear.
- Avoid formulaic openings such as "你已经...", "你已正确...", "你刚才提到...",
  "很好...", and their English equivalents. Quote the student's words only when a
  specific ambiguity must be clarified.

Return one or two concise sentences containing exactly one question mark. Normal
paths should output only the question. SUMMARIZE_RULE may prefix its question with
one general rule; PROVIDE_PSEUDOCODE may prefix its question with one abstract
reasoning outline. Never provide corrected code, a complete plan, or the exact bug
location. Respond to the latest
student answer and do not repeat a question already present in the conversation.
Target exactly one missing idea. Acknowledgement is optional and should be omitted
unless it materially improves clarity. Do not praise an incorrect answer.
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

    # The model validator is advisory. Subjective rejections such as
    # `uses_student_context` previously sent many good, contextual questions into
    # the same small fallback library, which made the dialogue sound scripted.
    model_failed_rules = [str(item) for item in parsed.get("failedRules", [])]
    failed_rules = []
    if _question_mark_count(question) != 1:
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
    reported_rules = list(dict.fromkeys(model_failed_rules + failed_rules))
    valid = bool(question) and not failed_rules
    retry_count = int(state.get("retry_count", 0)) + (0 if valid else 1)
    return {
        "validation": {"valid": valid, "failedRules": reported_rules},
        "retry_count": retry_count,
    }


def route_after_validation(state: Agent2State):
    if state.get("validation", {}).get("valid", False):
        return END
    if state.get("retry_count", 0) <= 1:
        return "generate_socratic_question"
    # Keep the model's second contextual attempt instead of replacing it with a
    # prewritten question. The caller will surface a real service error if model
    # generation itself fails.
    return END


builder = StateGraph(Agent2State)
builder.add_node("select_question_strategy", select_question_strategy_node)
builder.add_node("generate_socratic_question", generate_socratic_question_node)
builder.add_node("validate_question", validate_question_node)
builder.add_edge(START, "select_question_strategy")
builder.add_edge("select_question_strategy", "generate_socratic_question")
builder.add_edge("generate_socratic_question", "validate_question")
builder.add_conditional_edges("validate_question", route_after_validation)

agent2_graph = builder.compile()
