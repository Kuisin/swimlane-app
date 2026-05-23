import { Save } from "lucide-react";
import { ExportMenu } from "./export-menu";

export function EditorActionBar({
  src,
  modelTitle,
  themeBg,
  showStepBlockCaptions,
  counts,
  hasUnsavedChanges,
  onSave,
  modelType = "gui",
  extras = null,
}) {
  return (
    <div className="relative z-10 px-3 sm:px-4 py-2 border-b border-stone-700/60 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 shrink-0">
      <div className="flex items-center gap-1 font-mono text-[10px] text-stone-500 min-w-0 basis-full sm:basis-auto">
        {modelType === "text" && (
          <>
            <span>{counts.roles} roles</span>
            <span className="text-stone-700">·</span>
            <span>{counts.blocks} blocks</span>
            <span className="text-stone-700">·</span>
          </>
        )}
        <span>{counts.steps} steps</span>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 ml-auto">
        <ExportMenu
          src={src}
          modelTitle={modelTitle}
          themeBg={themeBg}
          showStepBlockCaptions={showStepBlockCaptions}
        />
        {extras}
        <button
          type="button"
          onClick={onSave}
          className={`flex items-center gap-1.5 text-xs font-jp px-3 py-2 border rounded-sm transition ${
            hasUnsavedChanges
              ? "border-amber-500 text-amber-300 bg-amber-950/40 hover:bg-amber-900/40"
              : "border-stone-700 text-stone-300 hover:bg-stone-800"
          }`}
        >
          <Save size={14} /> {hasUnsavedChanges ? "保存*" : "保存"}
        </button>
      </div>
    </div>
  );
}
