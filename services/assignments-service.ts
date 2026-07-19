import type { AssignmentAnalysisResponse } from "@/types/import";

export interface AssignmentAnalysisClientResponse extends AssignmentAnalysisResponse {
  extractedCharacterCount: number;
  keywordCount: number;
}

export async function analyzeAssignmentFile(file: File): Promise<AssignmentAnalysisClientResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/assignments/analyze", {
    method: "POST",
    body: formData,
  });
  const payload = await response.json() as
    | AssignmentAnalysisClientResponse
    | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in payload && payload.error
        ? payload.error
        : "We could not analyze this file. Try uploading a DOCX, TXT, or text-based PDF.",
    );
  }

  return payload as AssignmentAnalysisClientResponse;
}
