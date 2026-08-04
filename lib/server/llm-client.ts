import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

export interface LlmJsonRequest<T extends Record<string, unknown>> {
  systemPrompt: string;
  userPrompt: string;
  responseSchemaName: string;
  schema: z.ZodType<T>;
}

export interface LlmClient {
  isConfigured: boolean;
  model: string;
  generateJson<T extends Record<string, unknown>>(request: LlmJsonRequest<T>): Promise<T>;
}

export function createLlmClient(): LlmClient {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  return {
    isConfigured: Boolean(apiKey),
    model,
    async generateJson<T extends Record<string, unknown>>(
      request: LlmJsonRequest<T>,
    ): Promise<T> {
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not configured.");
      }

      const llm = new ChatOpenAI({
        apiKey,
        model,
        maxRetries: 2,
        timeout: 30_000,
        ...(!model.startsWith("gpt-5") ? { temperature: 0.2 } : {}),
      });
      const structuredLlm = llm.withStructuredOutput(request.schema, {
        name: request.responseSchemaName,
        method: "jsonSchema",
        strict: true,
      });
      const result = await structuredLlm.invoke([
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userPrompt },
      ]);

      return result as T;
    },
  };
}
