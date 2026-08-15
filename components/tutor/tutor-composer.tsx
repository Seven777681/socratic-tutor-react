"use client";

import { useState } from "react";
import type { TutorStatus } from "@/types/tutor";
import { SendIcon } from "@/components/dashboard/dashboard-icons";
import { LightbulbIcon } from "@/components/dashboard/dashboard-icons";

const MAX_MESSAGE_LENGTH = 1000;

export function TutorComposer({
  status,
  placeholder,
  onSend,
  showHint = false,
  hintLevel = 0,
  onHint,
}: {
  status: TutorStatus;
  placeholder: string;
  onSend: (message: string) => void;
  showHint?: boolean;
  hintLevel?: number;
  onHint?: () => void;
}) {
  const [draft, setDraft] = useState("");
  const trimmed = draft.trim();
  const isDisabled = status === "thinking" || trimmed.length === 0;

  const send = () => {
    if (isDisabled) {
      return;
    }
    onSend(trimmed);
    setDraft("");
  };

  return (
    <div className="border-t border-[#E4E7F0] bg-white px-4 py-3">
      {showHint ? (
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            disabled={status === "thinking"}
            onClick={onHint}
            aria-label="向 AI 导师请求提示"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/70 px-3 text-xs font-bold text-amber-700 transition hover:border-amber-300 hover:bg-amber-50 focus:outline-none focus:ring-4 focus:ring-amber-100 disabled:cursor-wait disabled:opacity-55"
          >
            <LightbulbIcon className="h-4 w-4" />
            提示
          </button>
          {hintLevel > 0 ? (
            <span className="text-[11px] font-semibold text-slate-400">
              提示等级 {Math.min(3, hintLevel)}/3
            </span>
          ) : null}
        </div>
      ) : null}
      <label htmlFor="tutor-message" className="sr-only">
        输入你当前的想法
      </label>
      <div className="flex items-end gap-2">
        <textarea
          id="tutor-message"
          value={draft}
          maxLength={MAX_MESSAGE_LENGTH}
          rows={2}
          disabled={status === "thinking"}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              send();
            }
          }}
          placeholder={placeholder}
          className="max-h-28 min-h-[54px] flex-1 resize-none overflow-y-auto rounded-xl border border-[#E4E7F0] bg-[#FBFCFF] px-3 py-2 text-sm leading-6 text-[#101426] outline-none transition placeholder:text-slate-400 focus:border-[#6255f6] focus:ring-4 focus:ring-[#6255f6]/10 disabled:opacity-70"
        />
        <button
          type="button"
          onClick={send}
          disabled={isDisabled}
          aria-label="发送消息给 AI 导师"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(90deg,#6657f5,#4678ff)] text-white shadow-md shadow-indigo-200/70 transition hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55"
        >
          <SendIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-2 flex justify-end">
        <span className="text-xs font-bold text-slate-400">
          {draft.length}/{MAX_MESSAGE_LENGTH}
        </span>
      </div>
    </div>
  );
}
