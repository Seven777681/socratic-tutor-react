export interface LlmJsonRequest {
  systemPrompt: string;
  userPrompt: string;
  responseSchemaName: string;
}

export interface LlmClient {
  isConfigured: boolean;
  model: string;
  generateJson<T>(request: LlmJsonRequest): Promise<T>;
}

export function createLlmClient(): LlmClient {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  return {
    isConfigured: Boolean(apiKey),
    model,
    async generateJson<T>(_request: LlmJsonRequest): Promise<T> {
      throw new Error(
        "LLM generation is not enabled yet. Configure the assignment or tutor generator to call this server-only client.",
      );
    },
  };
}
