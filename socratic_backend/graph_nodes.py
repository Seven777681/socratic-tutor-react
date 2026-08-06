from langchain_openai import ChatOpenAI
from graph_state import TutorState
from prompts import AGENT1_PROMPT, AGENT2_PROMPT, AGENT3_PROMPT, AGENT4_PROMPT, AGENT5_PROMPT
import os
from dotenv import load_dotenv

load_dotenv()
llm = ChatOpenAI(
    model=os.getenv("MODEL_NAME"),
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_BASE_URL"),
    temperature=0.1
)

# Agent1：计划理解节点
def plan_agent(state: TutorState) -> TutorState:
    user_input = f"Problem: {state['problem_content']}\nPlan Info: {state['plan_form']}"
    resp = llm.invoke([("system", AGENT1_PROMPT), ("human", user_input)])
    text = resp.content.strip()
    score = 0
    q = ""
    for line in text.splitlines():
        if line.startswith("understanding_score:"):
            score = int(line.split(":")[1].strip())
        if line.startswith("guide_question:"):
            q = line.split(":")[1].strip()
    state["understanding_score"] = score
    state["socratic_question"] = q
    return state

# Agent3：代码分析节点
def code_analysis_agent(state: TutorState) -> TutorState:
    user_input = f"Problem: {state['problem_content']}\nCode: {state['student_code']}\nPredicted Output: {state['code_prediction']}"
    resp = llm.invoke([("system", AGENT3_PROMPT), ("human", user_input)])
    err_type = resp.content.split("error_type:")[-1].strip()
    state["code_error_type"] = err_type
    return state

# Agent4：元认知监测节点
def monitor_agent(state: TutorState) -> TutorState:
    chat = str(state["messages"])
    err_records = state["code_error_type"]
    idle = state["is_stuck"]
    user_input = f"Chat History: {chat}\nError Records: {err_records}\nIdle Over 1min: {idle}"
    resp = llm.invoke([("system", AGENT4_PROMPT), ("human", user_input)])
    cl = 0
    stuck = False
    for line in resp.content.splitlines():
        if line.startswith("confusion_level:"):
            cl = int(line.split(":")[1].strip())
        if line.startswith("is_stuck:"):
            stuck = line.split(":")[1].strip().lower() == "true"
    state["confusion_level"] = cl
    state["is_stuck"] = stuck
    # 卡顿自动升级hint等级，最高3级
    if stuck and state["hint_level"] < 3:
        state["hint_level"] += 1
    return state

# Agent2：苏格拉底对话节点
def socratic_agent(state: TutorState) -> TutorState:
    user_input = (
        f"Problem: {state['problem_content']}\nCode: {state['student_code']}\n"
        f"Error Type: {state['code_error_type']}\nConfusion Level: {state['confusion_level']}\n"
        f"Is Stuck: {state['is_stuck']}\nHint Level: {state['hint_level']}\nChat: {state['messages']}"
    )
    resp = llm.invoke([("system", AGENT2_PROMPT), ("human", user_input)])
    q = resp.content.split("question:")[-1].strip()
    state["socratic_question"] = q
    state["messages"].append(resp)
    return state

# Agent5：评估反思节点
def assessment_agent(state: TutorState) -> TutorState:
    user_input = (
        f"Problem: {state['problem_content']}\nCode: {state['student_code']}\n"
        f"Error Records: {state['code_error_type']}\nChat History: {state['messages']}\nReflection: {state['student_reflection']}"
    )
    resp = llm.invoke([("system", AGENT5_PROMPT), ("human", user_input)])
    summary = resp.content.split("summary:")[-1].strip()
    state["learning_summary"] = summary
    state["task_finished"] = True
    return state