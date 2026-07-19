import Link from "next/link";
import {
  ArrowRightIcon,
  FileCodeIcon,
} from "@/components/dashboard/dashboard-icons";

export function QuickUploadCard() {
  return (
    <section className="rounded-[22px] border border-[#E4E7F0] bg-white p-6 shadow-[0_18px_55px_rgba(78,91,130,0.09)] sm:p-7">
      <div className="flex h-full flex-col">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
          <FileCodeIcon className="h-6 w-6" />
        </span>

        <div className="mt-5">
          <p className="text-sm font-semibold text-[#6255f6]">Quick Upload</p>
          <h2 className="mt-3 text-2xl font-extrabold tracking-normal text-[#101426]">
            Upload a class file and generate practice tasks.
          </h2>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {["PDF", "DOCX", "PPTX", "TXT", "MD"].map((type) => (
            <span
              key={type}
              className="rounded-full bg-[#F5F7FF] px-3 py-1 text-xs font-bold text-slate-600"
            >
              {type}
            </span>
          ))}
        </div>

        <p className="mt-5 text-sm font-semibold leading-6 text-slate-500">
          Files stay in your browser in this prototype.
        </p>

        <Link
          href="/assignment-import"
          className="group mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[linear-gradient(90deg,#6657f5,#4678ff)] px-4 text-sm font-bold text-white shadow-lg shadow-indigo-200/80 transition hover:shadow-xl hover:shadow-indigo-200 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:scale-[0.99] sm:w-auto lg:mt-auto"
        >
          Import Assignment
          <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
