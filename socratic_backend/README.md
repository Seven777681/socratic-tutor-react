# Socratic Tutor Backend

FastAPI service used by the Next.js application for isolated Python code
execution. The single five-Agent tutor workflow runs in Next.js via
LangGraph.js; this Python service does not contain a second tutor graph.

## Setup

```bash
cd socratic_backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

No API key is required for `/api/code/run`.

## Run

```bash
uvicorn server:app --reload --port 8001
```

Health check: `GET http://127.0.0.1:8001/health`

## How it connects to the frontend

The Next.js route `app/api/code/run/route.ts` proxies code execution to
`POST http://127.0.0.1:8001/api/code/run`, configurable with the
`SOCRATIC_BACKEND_URL` environment variable. Tutor requests remain inside the
Next.js server and use `lib/server/tutor-multi-agent.ts`.

Tutor requests are handled exclusively by the Next.js
`POST /api/tutor/message` route.

## Notes

The subprocess code runner is intended for trusted local development only. Python isolated mode and execution timeouts are not a security sandbox, so do not expose this endpoint publicly or run untrusted code in production without a dedicated sandbox.

- The Next.js tutor API owns Agent routing, state, prompts, guards, and model
  access.
- This service owns Python process execution, timeout handling, and public or
  hidden test execution only.
