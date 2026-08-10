# Socratic Tutor Backend

FastAPI service used by the Next.js application for isolated Python code
execution. The repository also retains an experimental Python implementation
of the five tutoring agents, but the active tutor workflow runs in Next.js via
LangGraph.js.

## Setup

```bash
cd socratic_backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

The base requirements are sufficient for health checks and real Python code
execution. To experiment with the legacy Python agents later, install:

```bash
pip install -r requirements-agents.txt
```

No API key is required for `/api/code/run`. Only if you deliberately test the
legacy Python tutor endpoint, copy `.env.example` to `.env` and add model
credentials:

```
OPENAI_API_KEY=...
OPENAI_BASE_URL=...
MODEL_NAME=...
```

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

The legacy `/api/tutor/message` route remains available for experiments and
routes requests by `stage`/`action`:

| Frontend stage/action | Agent(s) called |
|---|---|
| `stage === "plan"` or `action === "review_plan"` | Agent 1 (plan review) |
| `action === "generate_reflection_summary"` | Agent 5 (reflection) |
| everything else (coding/debugging) | Agent 3 (code analysis) → Agent 4 (monitor) → Agent 2 (Socratic dialogue) |

## Notes

The subprocess code runner is intended for trusted local development only. Python isolated mode and execution timeouts are not a security sandbox, so do not expose this endpoint publicly or run untrusted code in production without a dedicated sandbox.

- `graph_nodes.py` + `tutor_graph.py` contains the teammate's alternate Python
  LangGraph workflow. It is loaded lazily only when the legacy Python tutor
  endpoint is called, so the code runner can start with the base requirements.
- The active Next.js tutor API uses the TypeScript LangGraph workflow. The
  Python workflow is retained for comparison and future experiments.
- `main.py` is an unused PyCharm template file and can be deleted.
