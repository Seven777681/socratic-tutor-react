import { CodeIcon } from "@/components/dashboard/dashboard-icons";

export function EditorPlaceholder() {
  return (
    <section className="flex min-h-[260px] flex-col rounded-[18px] border border-[#E4E7F0] bg-white p-6 shadow-[0_14px_40px_rgba(78,91,130,0.07)]">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
        <CodeIcon className="h-6 w-6" />
      </span>
      <h2 className="mt-5 text-xl font-extrabold tracking-normal text-[#101426]">
        Code Editor
      </h2>
      <p className="mt-2 max-w-[520px] text-sm leading-6 text-slate-600">
        The Python editor will be implemented in the next step.
      </p>
    </section>
  );
}
