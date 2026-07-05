import { BotIcon } from "@/components/dashboard/dashboard-icons";

export function TutorPlaceholder() {
  return (
    <section className="flex min-h-[260px] flex-col rounded-[18px] border border-[#E4E7F0] bg-white p-6 shadow-[0_14px_40px_rgba(78,91,130,0.07)]">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
        <BotIcon className="h-6 w-6" />
      </span>
      <h2 className="mt-5 text-xl font-extrabold tracking-normal text-[#101426]">
        Socratic AI Tutor
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        The guided tutoring panel will be implemented in a later step.
      </p>
    </section>
  );
}
