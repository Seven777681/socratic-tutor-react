import type { TaskExample as TaskExampleType } from "@/types/task";

export function TaskExample({
  example,
  label,
}: {
  example: TaskExampleType;
  label: string;
}) {
  return (
    <article className="rounded-xl border border-[#E4E7F0] bg-[#F8FAFF] p-3">
      <h4 className="text-xs font-extrabold uppercase tracking-normal text-slate-500">
        {label}
      </h4>
      <div className="mt-3 grid gap-3">
        <div>
          <p className="text-xs font-bold text-slate-500">Input</p>
          <pre className="mt-1 overflow-x-auto rounded-lg border border-[#E4E7F0] bg-white px-3 py-2 text-sm text-[#101426]">
            <code>{example.input}</code>
          </pre>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500">Output</p>
          <pre className="mt-1 overflow-x-auto rounded-lg border border-[#E4E7F0] bg-white px-3 py-2 text-sm text-[#101426]">
            <code>{example.output}</code>
          </pre>
        </div>
      </div>
    </article>
  );
}
