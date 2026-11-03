from langgraph.graph import END, START, StateGraph

from graph_nodes import (
    code_diagnosis_agent,
    learning_state_monitor,
    problem_understanding_agent,
    reflection_summary_agent,
    socratic_dialogue_agent,
    student_answer_evaluator,
)
from graph_state import TutorState


def route_entry(state: TutorState):
    action = state.get("action", "")
    stage = state.get("stage", "")
    if action == "generate_reflection_summary":
        return "reflection_summary_agent"
    if action in {"review_plan", "understand_problem"} or stage == "plan":
        return "problem_understanding_agent"
    if action == "debug" or stage == "debug":
        return "code_diagnosis_agent"
    return "student_answer_evaluator"


def route_after_plan(state: TutorState):
    return END if state.get("can_enter_coding", False) else "learning_state_monitor"


def route_after_code_analysis(state: TutorState):
    return (
        "student_answer_evaluator"
        if state.get("student_answer", "").strip()
        else "learning_state_monitor"
    )


builder = StateGraph(TutorState)

builder.add_node("problem_understanding_agent", problem_understanding_agent)
builder.add_node("student_answer_evaluator", student_answer_evaluator)
builder.add_node("code_diagnosis_agent", code_diagnosis_agent)
builder.add_node("learning_state_monitor", learning_state_monitor)
builder.add_node("socratic_dialogue_agent", socratic_dialogue_agent)
builder.add_node("reflection_summary_agent", reflection_summary_agent)

builder.add_conditional_edges(START, route_entry)
builder.add_conditional_edges("problem_understanding_agent", route_after_plan)
builder.add_edge("reflection_summary_agent", END)
builder.add_conditional_edges("code_diagnosis_agent", route_after_code_analysis)
builder.add_edge("student_answer_evaluator", "learning_state_monitor")
builder.add_edge("learning_state_monitor", "socratic_dialogue_agent")
builder.add_edge("socratic_dialogue_agent", END)

graph = builder.compile()
