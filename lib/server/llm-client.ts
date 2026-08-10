import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

export type LlmProvider = "openai" | "deepseek";

export interface LlmRuntimeConfig {
  provider: LlmProvider;
  apiKey: string | undefined;
  model: string;
  baseURL: string | undefined;
}

export interface LlmJsonRequest<T extends Record<string, unknown>> {
  systemPrompt: string;
  userPrompt: string;
  responseSchemaName: string;
  schema: z.ZodType<T>;
}

export interface LlmClient {
  isConfigured: boolean;
  provider: LlmProvider;
  model: string;
  generateJson<T extends Record<string, unknown>>(request: LlmJsonRequest<T>): Promise<T>;
}

function nonEmpty(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function resolveLlmRuntimeConfig(
  env: Record<string, string | undefined> = process.env,
): LlmRuntimeConfig {
  const explicitProvider = nonEmpty(env.LLM_PROVIDER)?.toLowerCase();
  const genericBaseURL = nonEmpty(env.LLM_BASE_URL);
  const shouldInferDeepSeek =
    Boolean(nonEmpty(env.DEEPSEEK_API_KEY)) && !nonEmpty(env.OPENAI_API_KEY);
  const provider: LlmProvider =
    explicitProvider === "deepseek" ||
    (!explicitProvider &&
      (shouldInferDeepSeek || genericBaseURL?.includes("deepseek.com")))
      ? "deepseek"
      : "openai";

  if (provider === "deepseek") {
    return {
      provider,
      apiKey:
        nonEmpty(env.LLM_API_KEY) ??
        nonEmpty(env.DEEPSEEK_API_KEY) ??
        nonEmpty(env.OPENAI_API_KEY),
      model:
        nonEmpty(env.LLM_MODEL) ??
        nonEmpty(env.DEEPSEEK_MODEL) ??
        "deepseek-v4-flash",
      baseURL:
        genericBaseURL ??
        nonEmpty(env.DEEPSEEK_BASE_URL) ??
        "https://api.deepseek.com",
    };
  }

  return {
    provider,
    apiKey: nonEmpty(env.LLM_API_KEY) ?? nonEmpty(env.OPENAI_API_KEY),
    model:
      nonEmpty(env.LLM_MODEL) ??
      nonEmpty(env.OPENAI_MODEL) ??
      "gpt-4.1-mini",
    baseURL: genericBaseURL ?? nonEmpty(env.OPENAI_BASE_URL),
  };
}

export function createLlmClient(): LlmClient {
  const config = resolveLlmRuntimeConfig();

  return {
    isConfigured: Boolean(config.apiKey),
    provider: config.provider,
    model: config.model,
    async generateJson<T extends Record<string, unknown>>(
      request: LlmJsonRequest<T>,
    ): Promise<T> {
      if (!config.apiKey) {
        throw new Error(
          `No API key is configured for the ${config.provider} LLM provider.`,
        );
      }

      const llm = new ChatOpenAI({
        apiKey: config.apiKey,
        model: config.model,
        maxRetries: 2,
        timeout: 30_000,
        useResponsesApi: false,
        ...(config.baseURL
          ? { configuration: { baseURL: config.baseURL } }
          : {}),
        ...(!config.model.startsWith("gpt-5") ? { temperature: 0.2 } : {}),
      });
      const structuredLlm =
        config.provider === "deepseek"
          ? llm.withStructuredOutput(request.schema, {
              name: request.responseSchemaName,
              method: "functionCalling",
            })
          : llm.withStructuredOutput(request.schema, {
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
