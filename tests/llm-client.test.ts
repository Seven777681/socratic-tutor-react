import assert from "node:assert/strict";
import test from "node:test";

import { resolveLlmRuntimeConfig } from "@/lib/server/llm-client";

test("keeps the existing OpenAI environment variables compatible", () => {
  assert.deepEqual(
    resolveLlmRuntimeConfig({
      OPENAI_API_KEY: "openai-test-key",
      OPENAI_MODEL: "gpt-test",
    }),
    {
      provider: "openai",
      apiKey: "openai-test-key",
      model: "gpt-test",
      baseURL: undefined,
    },
  );
});

test("supports explicit DeepSeek configuration", () => {
  assert.deepEqual(
    resolveLlmRuntimeConfig({
      LLM_PROVIDER: "deepseek",
      LLM_API_KEY: "deepseek-test-key",
      LLM_MODEL: "deepseek-test-model",
    }),
    {
      provider: "deepseek",
      apiKey: "deepseek-test-key",
      model: "deepseek-test-model",
      baseURL: "https://api.deepseek.com",
    },
  );
});

test("infers DeepSeek when only its provider-specific key is present", () => {
  const config = resolveLlmRuntimeConfig({
    DEEPSEEK_API_KEY: "deepseek-test-key",
  });

  assert.equal(config.provider, "deepseek");
  assert.equal(config.apiKey, "deepseek-test-key");
  assert.equal(config.baseURL, "https://api.deepseek.com");
});

test("never exposes an API key through defaults", () => {
  const config = resolveLlmRuntimeConfig({});

  assert.equal(config.apiKey, undefined);
  assert.equal(config.provider, "openai");
});
