from langgraph.graph import StateGraph, START, END
from graph_state import TutorState
from graph_nodes import plan_agent, code_analysis_agent, monitor_agent, socratic_agent, assessment_agent

# 条件路由1：计划阶段分流
def route_plan(state: TutorState):
    # 理解分数≥5放行编码，不足继续提问
    if state["understanding_score"] >= 5:
        return "code_analysis_agent"
    return "socratic_agent"

# 条件路由2：编码阶段循环分流
def route_coding(state: TutorState):
    # 有错误 / 学生卡顿 → 返回苏格拉底对话
    if state["is_stuck"] or state["code_error_type"] != "No Error":
        return "socratic_agent"
    # 无错误进入反思评估
    return "assessment_agent"

# 搭建流程图
builder = StateGraph(TutorState)

# 注册所有智能体节点
builder.add_node("plan_agent", plan_agent)
builder.add_node("code_analysis_agent", code_analysis_agent)
builder.add_node("monitor_agent", monitor_agent)
builder.add_node("socratic_agent", socratic_agent)
builder.add_node("assessment_agent", assessment_agent)

# 入口：先执行计划评审
builder.add_edge(START, "plan_agent")

# 计划节点条件分支
builder.add_conditional_edges("plan_agent", route_plan)

# 代码分析后固定走监测
builder.add_edge("code_analysis_agent", "monitor_agent")

# 监测节点条件分支
builder.add_conditional_edges("monitor_agent", route_coding)

# 反思节点直接结束流程
builder.add_edge("assessment_agent", END)

# 对话提问后回到计划/编码循环
builder.add_edge("socratic_agent", "plan_agent")

# 编译图，全局单例
graph = builder.compile()