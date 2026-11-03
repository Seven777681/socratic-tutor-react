from agent_services import (
    run_basic_learning_state_monitor,
    run_problem_understanding_agent,
    run_reflection_summary_agent,
    run_socratic_dialogue_agent,
    run_static_code_analysis_agent,
)


def main():
    # Test problem: Calculate the average of three scores
    problem = "Input three integer scores and calculate their average value."

    print("=== Testing Problem Understanding Agent ===")
    approach = "Add the three scores and divide by 3."
    steps = ["1. Input three scores", "2. Calculate the sum", "3. Divide the sum by 3"]
    understanding_result = run_problem_understanding_agent(problem, approach, "\n".join(steps))
    print(understanding_result)

    print("\n=== Testing Code Analysis Agent ===")
    code = "a = 90\nb = 80\nc = 70\ntotal = a + b + c\navg = total / 2\nprint(avg)"
    predict_output = "80"
    code_analysis_result = run_static_code_analysis_agent(problem, code, predict_output)
    print(code_analysis_result)

    print("\n=== Testing Learning State Monitor ===")
    chat_history = "Student keeps getting wrong average results."
    error_records = ["Calculation Error"]
    idle_over_1min = True
    monitor_result = run_basic_learning_state_monitor(chat_history, error_records, idle_over_1min)
    print(monitor_result)

    print("\n=== Testing Socratic Dialogue Agent ===")
    dialogue_result = run_socratic_dialogue_agent(
        problem=problem,
        code=code,
        error_type="Calculation Error",
        confusion_level=3,
        is_stuck=True,
        hint_level=1,
        chat_history="Student keeps getting wrong average results."
    )
    print(dialogue_result)

    print("\n=== Testing Reflection Summary Agent ===")
    reflection_result = run_reflection_summary_agent(
        problem=problem,
        code=code,
        error_records=["Calculation Error"],
        chat_history="Student made calculation error in average calculation.",
        reflection_text="I confused dividing by 2 instead of 3."
    )
    print(reflection_result)


if __name__ == "__main__":
    main()
