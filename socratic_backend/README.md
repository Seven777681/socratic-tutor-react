# Socratic Tutor Backend

FastAPI service that exposes the 5 tutoring agents (plan review, Socratic
dialogue, code analysis, metacognitive monitoring, reflection summary) over
HTTP so the Next.js frontend can call real LLM-backed responses instead of
mock data.

## Setup

```bash
cd socratic_backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Make sure `.env` has your model credentials and MySQL connection:

```
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.deepseek.com
MODEL_NAME=deepseek-coder
DATABASE_URL=mysql+pymysql://socratic_app:password@127.0.0.1:3306/socratic_tutor?charset=utf8mb4
```

## Run

```bash
uvicorn server:app --reload --port 8001
```

Health checks:

- `GET http://127.0.0.1:8001/health`
- `GET http://127.0.0.1:8001/health/db`

The backend uses SQLAlchemy with PyMySQL. The tables are created from
`models.py` when the API starts; all database access is kept in `database.py`.

## Memory foundation

The first memory phase runs in shadow mode: it records observable Tutor state
without changing prompts or responses. `memory/` owns the memory logic,
`task_memories` keeps one current record per account and task, and
`memory_events` stores an audit trail of memory changes. AI Tutor requests use
the bearer token issued at login, so memory ownership comes from a verified
`accounts.id` rather than a client-supplied account ID.

## How it connects to the frontend

The Next.js route `app/api/tutor/message/route.ts` proxies every tutor
request to `POST http://127.0.0.1:8001/api/tutor/message` (configurable via
the `SOCRATIC_BACKEND_URL` env var on the Next.js side). Request/response
JSON field names match `types/tutor.ts` (`TutorRequest` / `TutorResponse`)
so no field remapping is needed on either side.

`server.py` routes each request to the right agent based on `stage`/`action`:

| Frontend stage/action | Agent(s) called |
|---|---|
| `stage === "plan"` or `action === "review_plan"` | Agent 1 (plan review) |
| `action === "generate_reflection_summary"` | Agent 5 (reflection) |
| everything else (coding/debugging) | Agent 3 (code analysis) → Agent 4 (monitor) → Agent 2 (Socratic dialogue) |

## Notes

- `agent_services.py` (plain function calls via `llm_base.py`) is the
  implementation actually wired into `server.py`.
- `graph_nodes.py` + `tutor_graph.py` is an alternate LangGraph state-machine
  implementation of the same 5 agents. It is currently unused by the HTTP
  server but kept for reference/future use if you want the strict
  Plan → Code → Monitor → Reflect state machine enforced server-side instead
  of being driven by the frontend's `stage` field.
- `main.py` is an unused PyCharm template file and can be deleted.
