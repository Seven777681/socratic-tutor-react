from langgraph.graph import END, START, StateGraph

from graph_nodes import (
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
    if action == "generate_reflection_summary" or stage == "reflect":
        return "assessment_agent"
    if action in {"review_plan", "understand_problem"} or stage == "plan":
        return "plan_agent"
    return "code_analysis_agent"


builder = StateGraph(TutorState)

builder.add_node("plan_agent", plan_agent)
builder.add_node("code_analysis_agent", code_analysis_agent)
builder.add_node("monitor_agent", monitor_agent)
builder.add_node("socratic_agent", socratic_agent)
builder.add_node("assessment_agent", assessment_agent)

builder.add_conditional_edges(START, route_entry)
builder.add_edge("plan_agent", END)
builder.add_edge("assessment_agent", END)
builder.add_edge("code_analysis_agent", "monitor_agent")
builder.add_edge("monitor_agent", "socratic_agent")
builder.add_edge("socratic_agent", END)

graph = builder.compile()
