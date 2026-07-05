import type { SaveStatus } from "@/types/task";
import type { CursorPosition } from "@/components/editor/editor-types";

function saveText(status: SaveStatus) {
  if (status === "saving") {
    return "Saving locally...";
  }

  if (status === "unsaved") {
    return "Unsaved";
  }

  return "Saved locally";
}

export function EditorFooterBar({
  cursorPosition,
  saveStatus,
}: {
  cursorPosition: CursorPosition;
  saveStatus: SaveStatus;
}) {
  return (
    <footer className="flex min-h-10 items-center justify-between gap-3 border-t border-[#E4E7F0] bg-[#F8FAFF] px-4 text-xs font-bold text-slate-500">
      <div className="flex items-center gap-3">
        <span>Python 3</span>
        <span>Spaces: 4</span>
        <span>UTF-8</span>
      </div>
      <div className="flex items-center gap-3">
        <span>
          Ln {cursorPosition.lineNumber}, Col {cursorPosition.column}
        </span>
        <span>{saveText(saveStatus)}</span>
      </div>
    </footer>
  );
}
