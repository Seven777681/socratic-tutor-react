import Link from "next/link";
import type { RecentUpload } from "@/types/dashboard";
import {
  ArrowRightIcon,
  FileCodeIcon,
} from "@/components/dashboard/dashboard-icons";
import { RecentUploadCard } from "@/components/dashboard/recent-upload-card";

export function RecentUploads({ uploads }: { uploads: RecentUpload[] }) {
  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-normal text-[#101426]">
            Recent Uploads
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Continue from the class files that generated your practice tasks.
          </p>
        </div>
        <Link
          href="/assignment-import"
          className="group hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-[#6255f6] transition hover:bg-indigo-50/70 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 sm:inline-flex"
        >
          Import New File
          <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>

      {uploads.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {uploads.map((upload) => (
            <RecentUploadCard key={upload.id} upload={upload} />
          ))}
        </div>
      ) : (
        <div className="rounded-[20px] border border-[#E4E7F0] bg-white p-8 text-center shadow-[0_16px_45px_rgba(78,91,130,0.08)]">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
            <FileCodeIcon className="h-6 w-6" />
          </span>
          <h3 className="mt-4 text-xl font-extrabold tracking-normal text-[#101426]">
            No uploads yet
          </h3>
          <p className="mx-auto mt-2 max-w-[420px] text-sm leading-6 text-slate-500">
            Upload an assignment or lecture file to generate thinking tasks.
          </p>
          <Link
            href="/assignment-import"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-[linear-gradient(90deg,#6657f5,#4678ff)] px-4 text-sm font-bold text-white shadow-lg shadow-indigo-200/80 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
          >
            Upload File
          </Link>
        </div>
      )}
    </section>
  );
}
