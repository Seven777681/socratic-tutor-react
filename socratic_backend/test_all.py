from agent_services import run_agent1, run_agent2, run_agent3, run_agent4, run_agent5


def main():
    # Test problem: Calculate the average of three scores
    problem = "Input three integer scores and calculate their average value."

    print("=== Testing Agent 1 (Plan Review) ===")
    approach = "Add the three scores and divide by 3."
    steps = ["1. Input three scores", "2. Calculate the sum", "3. Divide the sum by 3"]
    agent1_result = run_agent1(problem, approach, "\n".join(steps))
    print(agent1_result)

    print("\n=== Testing Agent 3 (Code Analysis) ===")
    code = "a = 90\nb = 80\nc = 70\ntotal = a + b + c\navg = total / 2\nprint(avg)"
    predict_output = "80"
    agent3_result = run_agent3(problem, code, predict_output)
    print(agent3_result)

    print("\n=== Testing Agent 4 (Metacognitive Monitoring) ===")
    chat_history = "Student keeps getting wrong average results."
    error_records = ["Calculation Error"]
    idle_over_1min = True
    agent4_result = run_agent4(chat_history, error_records, idle_over_1min)
    print(agent4_result)

    print("\n=== Testing Agent 2 (Socratic Dialogue) ===")
    agent2_result = run_agent2(
        problem=problem,
        code=code,
        error_type="Calculation Error",
        confusion_level=3,
        is_stuck=True,
        hint_level=1,
        chat_history="Student keeps getting wrong average results."
    )
    print(agent2_result)

    print("\n=== Testing Agent 5 (Reflection Summary) ===")
    agent5_result = run_agent5(
        problem=problem,
        code=code,
        error_records=["Calculation Error"],
        chat_history="Student made calculation error in average calculation.",
        reflection_text="I confused dividing by 2 instead of 3."
    )
    print(agent5_result)


if __name__ == "__main__":
    main()