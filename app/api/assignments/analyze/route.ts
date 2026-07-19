import { NextResponse } from "next/server";
import {
  extractKeywordCount,
  extractProgrammingConcepts,
  extractTextPreview,
} from "@/lib/server/assignment-analyzer";
import { extractTextFromAssignmentFile } from "@/lib/server/file-text-extractor";
import { generateTasksFromExtractedText } from "@/lib/server/generated-task-builder";
import type { AssignmentAnalysisResponse } from "@/types/import";

export const runtime = "nodejs";

const maxFileSize = 10 * 1024 * 1024;

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const value = formData.get("file");

    if (!(value instanceof File)) {
      return errorResponse("Upload a file before generating tasks.");
    }

    if (value.size === 0) {
      return errorResponse("This file is empty. Try uploading a file with readable assignment text.");
    }

    if (value.size > maxFileSize) {
      return errorResponse("This file is larger than 10MB. Choose a smaller class file.");
    }

    const extraction = await extractTextFromAssignmentFile(value);
    const warnings = [...extraction.warnings];
    const detectedConcepts = extractProgrammingConcepts(extraction.extractedText);

    if (!extraction.extractedText) {
      warnings.push(
        "No readable text was extracted from this file. Try uploading a text-based PDF, DOCX, TXT, or Markdown file.",
      );
    }

    if (extraction.extractedText && extraction.extractedText.length < 120) {
      warnings.push(
        "The extracted text is very short, so generated tasks may be less specific.",
      );
    }

    if (!detectedConcepts.length) {
      warnings.push(
        "We could not detect strong programming concepts, so a general practice task was generated.",
      );
    }

    const generatedTasks = generateTasksFromExtractedText({
      file: extraction.file,
      extractedText: extraction.extractedText,
      concepts: detectedConcepts,
    });

    if (!generatedTasks.length) {
      return errorResponse(
        "We could not generate tasks from this file. Try uploading a DOCX, TXT, or text-based PDF.",
        422,
      );
    }

    const response: AssignmentAnalysisResponse & {
      extractedCharacterCount: number;
      keywordCount: number;
    } = {
      assignmentFile: extraction.file,
      extractedText: extraction.extractedText,
      textPreview: extractTextPreview(extraction.extractedText),
      detectedConcepts,
      generatedTasks,
      warnings,
      extractedCharacterCount: extraction.extractedText.length,
      keywordCount: extractKeywordCount(detectedConcepts),
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "We could not analyze this file. Try uploading a DOCX, TXT, or text-based PDF.";

    return errorResponse(message, 500);
  }
}
