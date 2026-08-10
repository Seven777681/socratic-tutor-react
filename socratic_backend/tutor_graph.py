from langgraph.graph import END, START, StateGraph

from graph_nodes import (
    answer_evaluation_agent,
    assessment_agent,
    code_analysis_agent,
    monitor_agent,
    plan_agent,
    socratic_agent,
)
from graph_state import TutorState


def route_entry(state: TutorState):
    action = state.get("action", "")
    stage = state.get("stage", "")
    if action == "generate_reflection_summary":
        return "assessment_agent"
    if action in {"review_plan", "understand_problem"} or stage == "plan":
        return "plan_agent"
    if action == "debug" or stage == "debug":
        return "code_analysis_agent"
    return "answer_evaluation_agent"


def route_after_plan(state: TutorState):
    return END if state.get("can_enter_coding", False) else "monitor_agent"


builder = StateGraph(TutorState)

builder.add_node("plan_agent", plan_agent)
builder.add_node("answer_evaluation_agent", answer_evaluation_agent)
builder.add_node("code_analysis_agent", code_analysis_agent)
builder.add_node("monitor_agent", monitor_agent)
builder.add_node("socratic_agent", socratic_agent)
builder.add_node("assessment_agent", assessment_agent)

builder.add_conditional_edges(START, route_entry)
builder.add_conditional_edges("plan_agent", route_after_plan)
builder.add_edge("assessment_agent", END)
builder.add_edge("code_analysis_agent", "monitor_agent")
builder.add_edge("answer_evaluation_agent", "monitor_agent")
builder.add_edge("monitor_agent", "socratic_agent")
builder.add_edge("socratic_agent", END)

graph = builder.compile()
