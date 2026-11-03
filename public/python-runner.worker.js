/* global loadPyodide */

const PYODIDE_BASE_URL = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";
const MAX_OUTPUT_LENGTH = 12000;

let pyodidePromise;

function limitOutput(value) {
  const text = String(value || "");
  if (text.length <= MAX_OUTPUT_LENGTH) return text;
  return `${text.slice(0, MAX_OUTPUT_LENGTH)}\n... output truncated ...`;
}

async function initializePython() {
  importScripts(`${PYODIDE_BASE_URL}pyodide.js`);
  const runtime = await loadPyodide({ indexURL: PYODIDE_BASE_URL });
  self.fetch = () => Promise.reject(new Error("Network access is disabled in the Python runner."));
  self.XMLHttpRequest = undefined;
  self.WebSocket = undefined;
  self.EventSource = undefined;
  self.importScripts = () => {
    throw new Error("Loading external scripts is disabled in the Python runner.");
  };
  return runtime;
}

pyodidePromise = initializePython()
  .then((runtime) => {
    self.postMessage({ type: "ready" });
    return runtime;
  })
  .catch((error) => {
    self.postMessage({
      type: "initialization-error",
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  });

async function executeOnce(runtime, code, stdin) {
  runtime.globals.set("__student_code", code);
  runtime.globals.set("__student_stdin", stdin || "");
  const proxy = await runtime.runPythonAsync(`
import builtins
import contextlib
import io
import time
import traceback

_runner_stdout = io.StringIO()
_runner_stderr = io.StringIO()
_runner_inputs = iter(__student_stdin.splitlines())

def _runner_input(prompt=""):
    if prompt:
        print(prompt, end="")
    try:
        return next(_runner_inputs)
    except StopIteration:
        raise EOFError("EOF when reading a line")

_runner_original_input = builtins.input
_runner_started = time.perf_counter()
_runner_ok = True
try:
    builtins.input = _runner_input
    with contextlib.redirect_stdout(_runner_stdout), contextlib.redirect_stderr(_runner_stderr):
        exec(compile(__student_code, "<student-code>", "exec"), {"__name__": "__main__"})
except BaseException:
    _runner_ok = False
    traceback.print_exc(file=_runner_stderr)
finally:
    builtins.input = _runner_original_input

{
    "ok": _runner_ok,
    "stdout": _runner_stdout.getvalue(),
    "stderr": _runner_stderr.getvalue(),
    "elapsedMs": round((time.perf_counter() - _runner_started) * 1000),
}
  `);
  const result = proxy.toJs({ dict_converter: Object.fromEntries });
  proxy.destroy();
  return {
    ...result,
    stdout: limitOutput(result.stdout),
    stderr: limitOutput(result.stderr),
  };
}

self.onmessage = async (event) => {
  if (event.data?.type !== "run") return;
  const { requestId, code, stdin, testCases = [] } = event.data;
  try {
    const runtime = await pyodidePromise;
    const main = await executeOnce(runtime, code, stdin);
    const tests = [];
    if (main.ok) {
      for (const testCase of testCases) {
        const execution = await executeOnce(runtime, code, testCase.input || "");
        tests.push({ testCase, execution });
      }
    }
    self.postMessage({ type: "result", requestId, main, tests });
  } catch (error) {
    self.postMessage({
      type: "runner-error",
      requestId,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
