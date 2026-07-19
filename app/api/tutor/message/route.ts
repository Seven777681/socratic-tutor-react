import { NextResponse } from "next/server";
import type {
  GuidanceStage,
  TutorActionType,
  TutorMessage,
  TutorMode,
  TutorQuestionType,
  TutorRequest,
} from "@/types/tutor";

function createTutorMessage({
  content,
  stage,
  action,
  mode,
  questionType = "debugging",
}: {
  content: string;
  stage: GuidanceStage;
  action: TutorActionType;
  mode: TutorMode;
  questionType?: TutorQuestionType;
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
}: TutorRequest) {
  const hasStudentReasoning = conversation.some(
    (message) => message.role === "student",
  );

  if (action === "rephrase") {
    return {
      content:
        "Let me ask it another way: what should change after each step of your program, and what should stay the same?",
      questionType: "decomposition" as const,
    };
  }

  if (action === "smaller_hint") {
    return {
      content:
        "Try one tiny trace. If the input is 3, what should the running total be after adding 1?",
      questionType: "decomposition" as const,
    };
  }

  if (action === "check_reasoning" && !hasStudentReasoning) {
    return {
      content: "Share your reasoning first, and I’ll help you test it.",
      questionType: "reflection" as const,
    };
  }

  if (action === "check_reasoning") {
    return {
      content:
        "Which line in your code proves that the value you described will actually be updated?",
      questionType: "reflection" as const,
    };
  }

  if (latestRunResult?.status === "success") {
    return {
      content:
        "Nice, your code passed the available tests. Why does your approach include every value the problem asks for?",
      questionType: "reflection" as const,
    };
  }

  if (latestRunResult?.status === "timeout") {
    return {
      content:
        "Your program took too long to finish. What condition guarantees that the loop eventually stops?",
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
        "I won’t write the full solution for you, but I can help you build it. What is the next small decision: choosing the loop range, or updating the stored value?",
      questionType: "decomposition" as const,
    };
  }

  if (includesAny(studentMessage, ["不知道", "不懂", "not sure", "i don't know"])) {
    return {
      content:
        "Let’s shrink the problem. For a very small input, what output would you expect before thinking about the code?",
      questionType: "understanding" as const,
    };
  }

  if (currentCode.trim().length === 0) {
    return {
      content:
        "Before writing code, what value do you need to keep track of while solving this task?",
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
  try {
    const body = (await request.json()) as TutorRequest;

    if (!body.taskId || !body.stage || !body.mode || !Array.isArray(body.conversation)) {
      return NextResponse.json(
        { error: "Invalid tutor request." },
        { status: 400 },
      );
    }

    const { content, questionType } = getTutorContent(body);

    return NextResponse.json({
      message: createTutorMessage({
        content,
        stage: body.stage,
        action: body.action,
        mode: body.mode,
        questionType,
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Tutor request could not be processed." },
      { status: 500 },
    );
  }
}
