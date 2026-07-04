const progressClasses: Record<number, string> = {
  0: "w-0",
  20: "w-1/5",
  30: "w-[30%]",
  45: "w-[45%]",
  60: "w-3/5",
  100: "w-full",
};

export function TaskProgress({
  progress,
  label,
}: {
  progress: number;
  label: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
        <span>{label}</span>
        <span>{progress}%</span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-[#EEF2FF]"
        role="progressbar"
        aria-label={`${label}: ${progress}% complete`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div
          className={`h-full rounded-full bg-[linear-gradient(90deg,#6657f5,#4F7CFF)] transition-[width] duration-300 ${progressClasses[progress]}`}
        />
      </div>
    </div>
  );
}
