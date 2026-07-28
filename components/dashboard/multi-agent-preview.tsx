import {
  BotIcon,
  BugIcon,
  LightbulbIcon,
  TestTubeIcon,
} from "@/components/dashboard/dashboard-icons";

const tutorCapabilities = [
  {
    title: "Ask better questions",
    description: "Turn confusion into the next useful thought.",
    icon: LightbulbIcon,
  },
  {
    title: "Debug with context",
    description: "Reason through errors without jumping to answers.",
    icon: BugIcon,
  },
  {
    title: "Test ideas",
    description: "Check examples, edge cases, and assumptions.",
    icon: TestTubeIcon,
  },
];

export function MultiAgentPreview() {
  return (
    <section className="rounded-[22px] border border-[#E4E7F0] bg-white p-6 shadow-[0_18px_55px_rgba(78,91,130,0.09)] sm:p-7">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
        <BotIcon className="h-6 w-6" />
      </span>
      <h2 className="mt-5 text-2xl font-extrabold tracking-normal text-[#101426]">
        Socratic AI Tutor
      </h2>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
        Guided by multi-agent reasoning behind the scenes.
      </p>

      <div className="mt-5 grid gap-3">
        {tutorCapabilities.map((capability) => {
          const Icon = capability.icon;

          return (
            <div key={capability.title} className="flex gap-3 rounded-2xl bg-[#FBFCFF] p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#6255f6] shadow-sm">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-extrabold text-[#101426]">
                  {capability.title}
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  {capability.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
