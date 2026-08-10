import { NextResponse } from "next/server";
import type {
  GuidanceStage,
  TutorActionType,
  TutorMessage,
  TutorMode,
  TutorQuestionType,
  TutorRequest,
} from "@/types/tutor";
import { runTutorMultiAgent } from "@/lib/server/tutor-multi-agent";

function createTutorMessage({
  content,
  stage,
  action,
  mode,
  questionType = "debugging",
  questionStrategy,
  hintLevel,
  agentTrace,
  learnerState,
  understandingAssessment,
  learningAssessment,
  codeAnalysis,
  planReview,
  planInteraction,
}: {
  content: string;
  stage: GuidanceStage;
  action: TutorActionType;
  mode: TutorMode;
  questionType?: TutorQuestionType;
  questionStrategy?: TutorMessage["questionStrategy"];
  hintLevel?: number;
  agentTrace?: TutorMessage["agentTrace"];
  learnerState?: TutorMessage["learnerState"];
  understandingAssessment?: TutorMessage["understandingAssessment"];
  learningAssessment?: TutorMessage["learningAssessment"];
  codeAnalysis?: TutorMessage["codeAnalysis"];
  planReview?: TutorMessage["planReview"];
  planInteraction?: TutorMessage["planInteraction"];
}): TutorMessage {
  return {
    id: `tutor-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    role: "tutor",
    content,
    timestamp: new Date().toISOString(),
    stage,
    actionType: action,
    mode,
    questionType,
    questionStrategy,
    hintLevel,
    agentTrace,
    learnerState,
    understandingAssessment,
    learningAssessment,
    codeAnalysis,
    planReview,
    planInteraction,
  };
}

function createFallbackPlanState(body: TutorRequest) {
  const approachPresent = Boolean(body.planningData?.approach.trim());
  const completedSteps =
    body.planningData?.steps.filter((step) => step.trim()).length ?? 0;
  const canEnterCoding = approachPresent && completedSteps >= 2;
  return {
    understandingScore: canEnterCoding ? 7 : approachPresent ? 5 : 2,
    missingSteps: [
      ...(!approachPresent ? ["Describe the main approach."] : []),
      ...(completedSteps < 2 ? ["Add at least two ordered steps."] : []),
    ],
    canEnterCoding,
  };
}

function includesAny(text: string, terms: string[]) {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function getTutorContent({
  studentMessage,
  currentCode,
  latestRunResult,
  action,
  conversation,
  taskTitle,
  planningData,
  latestPrediction,
}: TutorRequest) {
  const hasStudentReasoning = conversation.some(
    (message) => message.role === "student",
  );
  const problemName = taskTitle ? `"${taskTitle}"` : "this problem";
  const hasPlan =
    Boolean(planningData?.approach.trim()) ||
    Boolean(planningData?.steps.some((step) => step.trim()));
  const codeLineCount = Math.max(1, currentCode.split("\n").length);

  if (action === "idle_check_in") {
    return {
      content: "Have you hit a sticking point, or are you still exploring your next step?",
      questionType: "reflection" as const,
    };
  }

  if (action === "rephrase") {
    return {
      content: `Let's look at ${problemName} another way: what information does the program need to keep track of, and what should it produce at the end?`,
      questionType: "decomposition" as const,
    };
  }

  if (action === "review_plan") {
    return {
      content: hasPlan
        ? "Your plan has a starting shape. Which step connects the input or initial data to the final output?"
        : "Before coding, what is the first small action your program needs to take for this problem?",
      questionType: "decomposition" as const,
    };
  }

  if (action === "generate_reflection_summary") {
    return {
      content:
        "You practiced connecting a plan, a prediction, code, and run feedback. You strengthened the habit of checking whether each part of the task is supported by your solution.",
      questionType: "reflection" as const,
    };
  }

  if (action === "explain_success") {
    return {
      content:
        "Which part of your code makes the successful result happen for more than just the sample input?",
      questionType: "reflection" as const,
    };
  }

  if (action === "debug") {
    return {
      content: latestRunResult?.error
        ? `The latest run points to: ${latestRunResult.error.title}. Which line or value should you inspect first?`
        : "Compare your expected result with the latest output. Where does the behavior first differ from your plan?",
      questionType: "debugging" as const,
    };
  }

  if (action === "check_edge_cases") {
    return {
      content:
        "Try a smallest input, a typical input, and a boundary input in your head. What should stay true for all three?",
      questionType: "transfer" as const,
    };
  }

  if (action === "reflect_solution") {
    return {
      content:
        latestRunResult?.status === "success"
          ? "What did you learn about why this solution works, and what would you check before trusting it on new inputs?"
          : "What changed in your thinking from reading the task to checking the current result?",
      questionType: "reflection" as const,
    };
  }

  if (action === "smaller_hint") {
    return {
      content:
        latestRunResult?.error?.hint ??
        "Trace one tiny example by hand. After the first meaningful step, what should be true?",
      questionType: "decomposition" as const,
    };
  }

  if (action === "check_reasoning" && !hasStudentReasoning) {
    return {
      content: "Share your reasoning first, and I'll help you test it.",
      questionType: "reflection" as const,
    };
  }

  if (action === "check_reasoning") {
    return {
      content: `You have about ${codeLineCount} lines of code. Which line proves that the value you described actually changes or gets used?`,
      questionType: "reflection" as const,
    };
  }

  if (latestRunResult?.status === "success") {
    return {
      content:
        "Your code passed the available checks. Why should the same idea still work on a different valid input?",
      questionType: "reflection" as const,
    };
  }

  if (latestRunResult?.status === "timeout") {
    return {
      content:
        "Your program took too long to finish. What condition guarantees that the program eventually stops?",
      questionType: "debugging" as const,
    };
  }

  if (latestRunResult?.error?.type === "syntax") {
    return {
      content:
        "Python is stopping before it can run your idea. Which line in the error message is Python pointing at?",
      questionType: "debugging" as const,
    };
  }

  if (latestRunResult?.error?.type === "runtime") {
    return {
      content:
        "The program starts, but something goes wrong while running. Which name or value in the error differs from what you intended?",
      questionType: "debugging" as const,
    };
  }

  if (
    includesAny(studentMessage, [
      "give me the code",
      "tell me the answer",
      "fix it",
      "solution",
      "answer",
    ])
  ) {
    return {
      content:
        "I won't write the full solution, but I can help you build it. What is the next small decision your program needs to make?",
      questionType: "decomposition" as const,
    };
  }

  if (includesAny(studentMessage, ["not sure", "i don't know", "i dont know"])) {
    return {
      content:
        "Let's shrink the problem. For a very small input, what output would you expect before thinking about the code?",
      questionType: "understanding" as const,
    };
  }

  if (currentCode.trim().length === 0) {
    return {
      content: `Before writing code for ${problemName}, what value or condition do you need to keep track of?`,
      questionType: "understanding" as const,
    };
  }

  if (latestPrediction?.trim() && !latestRunResult) {
    return {
      content:
        "You have a prediction but no run yet. Which line of your code should make that prediction come true?",
      questionType: "understanding" as const,
    };
  }

  return {
    content:
      "Look at your current code and the result together. What is the first line where the actual behavior starts to differ from your plan?",
    questionType: "debugging" as const,
  };
}
export async function POST(request: Request) {
  let body: TutorRequest;

  try {
    body = (await request.json()) as TutorRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid tutor request." },
      { status: 400 },
    );
  }

  if (!body.taskId || !body.stage || !body.mode || !Array.isArray(body.conversation)) {
    return NextResponse.json(
      { error: "Invalid tutor request." },
      { status: 400 },
    );
  }

  try {
    let content: string;
    let questionType: TutorQuestionType;
    let hintLevel: number | undefined;
    let questionStrategy: TutorMessage["questionStrategy"];
    let agentTrace: TutorMessage["agentTrace"];
    let learnerState: TutorMessage["learnerState"];
    let understandingAssessment: TutorMessage["understandingAssessment"];
    let learningAssessment: TutorMessage["learningAssessment"];
    let codeAnalysis: TutorMessage["codeAnalysis"];
    let planReview: TutorMessage["planReview"];
    let planInteraction: TutorMessage["planInteraction"];

    try {
      const multiAgentResult = await runTutorMultiAgent(body);
      if (multiAgentResult) {
        content = multiAgentResult.content;
        questionType = multiAgentResult.questionType;
        hintLevel = multiAgentResult.hintLevel;
        questionStrategy = multiAgentResult.questionStrategy;
        agentTrace = multiAgentResult.trace;
        learnerState = multiAgentResult.learnerState;
        understandingAssessment = multiAgentResult.understandingAssessment;
        learningAssessment = multiAgentResult.learningAssessment;
        codeAnalysis = multiAgentResult.codeAnalysis;
        planReview = multiAgentResult.planReview;
        planInteraction = multiAgentResult.planInteraction;
      } else {
        ({ content, questionType } = getTutorContent(body));
        if (body.stage === "plan") {
          const fallbackPlan = createFallbackPlanState(body);
          if (body.action === "review_plan" && !body.studentMessage.trim()) {
            planReview = fallbackPlan;
          } else if (body.studentMessage.trim()) {
            planInteraction = { ...fallbackPlan, showReviewCard: false };
          }
        }
      }
    } catch (error) {
      console.error("Multi-agent tutor failed; using local tutor fallback.", error);
      ({ content, questionType } = getTutorContent(body));
      if (body.stage === "plan") {
        const fallbackPlan = createFallbackPlanState(body);
        planReview = body.action === "review_plan"
          ? fallbackPlan
          : undefined;
        planInteraction = body.studentMessage.trim()
          ? { ...fallbackPlan, showReviewCard: false }
          : undefined;
      }
    }

    return NextResponse.json({
      message: createTutorMessage({
        content,
        stage: body.stage,
        action: body.action,
        mode: body.mode,
        questionType,
        questionStrategy,
        hintLevel,
        agentTrace,
        learnerState,
        understandingAssessment,
        learningAssessment,
        codeAnalysis,
        planReview,
        planInteraction,
      }),
    });
  } catch (error) {
    console.error("Tutor request could not be processed.", error);
    return NextResponse.json(
      { error: "Tutor request could not be processed." },
      { status: 500 },
    );
  }
}
