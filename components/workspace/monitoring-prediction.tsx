"use client";

export function MonitoringPrediction({
  value,
  warning,
  onChange,
  onSave,
}: {
  value: string;
  warning?: string;
  onChange: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <section className="border-t border-[#E4E7F0] bg-white px-5 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <label className="min-w-0 flex-1">
          <span className="text-sm font-extrabold text-[#101426]">
            Before You Run
          </span>
          <span className="mt-1 block text-sm font-semibold leading-6 text-slate-500">
            What output do you expect from your code?
          </span>
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Write your prediction before running the program."
            className="mt-2 min-h-[68px] w-full resize-none rounded-xl border border-[#E4E7F0] bg-[#FBFCFF] px-3 py-2 text-sm leading-6 text-[#101426] outline-none transition placeholder:text-slate-400 focus:border-[#6255f6] focus:ring-4 focus:ring-[#6255f6]/10"
          />
        </label>
        <button
          type="button"
          onClick={onSave}
          className="inline-flex h-10 w-fit items-center justify-center rounded-lg border border-[#b9b2ff] bg-white px-3 text-sm font-bold text-[#6255f6] transition hover:border-[#6255f6] hover:bg-indigo-50/70 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
        >
          Save Prediction
        </button>
      </div>
      {warning ? (
        <p className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">
          {warning}
        </p>
      ) : null}
    </section>
  );
}
