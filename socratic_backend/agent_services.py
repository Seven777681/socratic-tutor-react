from llm_base import base_llm_call
from prompts import AGENT1_PROMPT, AGENT2_PROMPT, AGENT3_PROMPT, AGENT4_PROMPT, AGENT5_PROMPT

def run_agent1(problem: str, approach: str, steps: str):
    user_input = f"Problem: {problem}\nApproach: {approach}\nSteps: {steps}"
    response_text = base_llm_call(AGENT1_PROMPT, user_input)
    result = {}
    for line in response_text.splitlines():
        if line.startswith("understanding_score:"):
            result["understanding_score"] = int(line.split(":")[1].strip())
        if line.startswith("guide_question:"):
            result["guide_question"] = line.split(":")[1].strip()
    return result

def run_agent2(problem: str, code: str, error_type: str, confusion_level: int, is_stuck: bool, hint_level: int, chat_history: str):
    user_input = f"Problem: {problem}\nCode: {code}\nError Type: {error_type}\nConfusion Level: {confusion_level}\nIs Stuck: {is_stuck}\nHint Level: {hint_level}\nChat History: {chat_history}"
    response_text = base_llm_call(AGENT2_PROMPT, user_input)
    return {"question": response_text.split("question:")[-1].strip()}

def run_agent3(problem: str, code: str, predict_output: str):
    user_input = f"Problem: {problem}\nCode: {code}\nPredicted Output: {predict_output}"
    response_text = base_llm_call(AGENT3_PROMPT, user_input)
    return {"error_type": response_text.split("error_type:")[-1].strip()}

def run_agent4(chat_history: str, error_records: list, idle_over_1min: bool):
    user_input = f"Chat History: {chat_history}\nError Records: {', '.join(error_records)}\nIdle Over 1min: {idle_over_1min}"
    response_text = base_llm_call(AGENT4_PROMPT, user_input)
    result = {}
    for line in response_text.splitlines():
        if line.startswith("confusion_level:"):
            result["confusion_level"] = int(line.split(":")[1].strip())
        if line.startswith("is_stuck:"):
            result["is_stuck"] = line.split(":")[1].strip().lower() == "true"
    return result

def run_agent5(problem: str, code: str, error_records: list, chat_history: str, reflection_text: str):
    user_input = f"Problem: {problem}\nCode: {code}\nError Records: {', '.join(error_records)}\nChat History: {chat_history}\nReflection: {reflection_text}"
    response_text = base_llm_call(AGENT5_PROMPT, user_input)
    return {"summary": response_text.split("summary:")[-1].strip()}