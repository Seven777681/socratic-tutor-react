from dotenv import load_dotenv
import os
from datetime import datetime, timezone
from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_BASE_URL")
)

model = os.getenv("MODEL_NAME")
llm_enabled = os.getenv("LLM_ENABLED", "false").strip().lower() == "true"

def base_llm_call(system_prompt: str, user_content: str) -> str:
    if not llm_enabled:
        raise RuntimeError("LLM requests are disabled by LLM_ENABLED=false")
    print(
        f"LLM_REQUEST_STARTED {datetime.now(timezone.utc).isoformat()} model={model}",
        flush=True,
    )
    rsp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        temperature=0.1
    )
    return rsp.choices[0].message.content.strip()
