import Link from "next/link";
import type { RecentUpload } from "@/types/dashboard";
import {
  ArrowRightIcon,
  FileCodeIcon,
  FileCodeIcon as FileTextIcon,
  PlayCircleIcon,
} from "@/components/dashboard/dashboard-icons";

function UploadIcon({ fileType }: { fileType: RecentUpload["fileType"] }) {
  const className = "h-5 w-5";

  if (fileType === "pptx") {
    return <PlayCircleIcon className={className} />;
  }

  if (fileType === "txt" || fileType === "markdown") {
    return <FileCodeIcon className={className} />;
  }

  return <FileTextIcon className={className} />;
}

function actionLabel(upload: RecentUpload) {
  return upload.progress >= 100 ? "Review Tasks" : "Continue Learning";
}

function actionHref(upload: RecentUpload) {
  if (upload.progress >= 100 || !upload.continueTaskId) {
    return `/tasks?source=${upload.id}`;
  }

  return `/tasks/${upload.continueTaskId}`;
}

export function RecentUploadCard({ upload }: { upload: RecentUpload }) {
  return (
    <article className="group flex min-h-[250px] flex-col rounded-[18px] border border-[#E4E7F0] bg-white p-5 shadow-[0_14px_40px_rgba(78,91,130,0.07)] transition duration-300 hover:border-indigo-200 hover:shadow-[0_18px_48px_rgba(78,91,130,0.12)] motion-safe:hover:-translate-y-0.5">
      <Link
        href={`/tasks?source=${upload.id}`}
        className="min-w-0 rounded-lg focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6] transition group-hover:bg-[#e3e0ff]">
            <UploadIcon fileType={upload.fileType} />
          </span>
          <span className="rounded-full bg-[#eceaff] px-3 py-1 text-xs font-bold text-[#6255f6]">
            {upload.language}
          </span>
        </div>

        <div className="mt-5 min-w-0">
          <h3
            className="truncate text-lg font-extrabold tracking-normal text-[#101426]"
            title={upload.fileName}
          >
            {upload.fileName}
          </h3>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {upload.generatedTaskCount} tasks generated
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Imported {upload.importedAt}
          </p>
        </div>
      </Link>

      <div className="mt-auto pt-6">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
          <span>
            {upload.completedTaskCount} of {upload.generatedTaskCount} completed
          </span>
          <span>{upload.progress}%</span>
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-[#EEF2FF]"
          role="progressbar"
          aria-label={`${upload.fileName} upload progress: ${upload.progress}%`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={upload.progress}
        >
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#6657f5,#4F7CFF)] transition-[width] duration-300"
            style={{ width: `${upload.progress}%` }}
          />
        </div>

        <Link
          href={actionHref(upload)}
          className={`mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 ${
            upload.progress >= 100
              ? "border border-[#b9b2ff] bg-white text-[#6255f6] hover:bg-indigo-50/70"
              : "bg-[linear-gradient(90deg,#6657f5,#4678ff)] text-white shadow-lg shadow-indigo-200/80 hover:shadow-xl hover:shadow-indigo-200"
          }`}
        >
          {actionLabel(upload)}
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
