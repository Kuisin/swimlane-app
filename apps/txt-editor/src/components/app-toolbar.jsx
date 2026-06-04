import { BookOpen, ChevronDown, FilePlus, FolderOpen, Save } from "lucide-react";
import { THEMES } from "@kai-swimlane/core";
import { useEditor } from "../hooks/use-editor";
import { useFolder } from "../context/folder-context";

export function AppToolbar({
  onShowHelp,
  onSave,
  hasUnsavedChanges: hasUnsavedOverride,
  saveDisabled = false,
}) {
  const { folderPath, openFolder, openSamples, createNewTxtFile, isReadOnly } = useFolder();
  const { themeKey, setThemeKey, hasUnsavedChanges, saveDocuments } = useEditor();
  const isUnsaved = !saveDisabled && !isReadOnly && (hasUnsavedOverride ?? hasUnsavedChanges);
  const save = onSave ?? saveDocuments;

  return (
    <header className="relative z-40 border-b border-stone-300 bg-stone-50 shrink-0">
      <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="font-display text-lg font-bold tracking-tight text-stone-900">
            TxtEditor
          </h1>
          <span className="text-[10px] font-jp px-2 py-0.5 my-auto rounded bg-stone-200 text-stone-600">
            GUI
          </span>


          <button
            type="button"
            onClick={openFolder}
            className="flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-300 rounded-sm hover:bg-stone-200 transition"
          >
            <FolderOpen size={14} /> フォルダ
          </button>
          {folderPath && !isReadOnly && (
            <button
              type="button"
              onClick={createNewTxtFile}
              className="flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-300 rounded-sm hover:bg-stone-200 transition"
            >
              <FilePlus size={14} /> 新規
            </button>
          )}
          <button
            type="button"
            onClick={onShowHelp}
            className="flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-300 rounded-sm hover:bg-stone-200 transition"
          >
            <BookOpen size={14} /> 構文
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">

          {!folderPath && (
            <button
              type="button"
              onClick={openSamples}
              className="text-xs font-jp px-3 py-2 border border-stone-300 rounded-sm hover:bg-stone-200 transition"
            >
              サンプル
            </button>
          )}

          {/* <ThemePicker themeKey={themeKey} onThemeChange={setThemeKey} /> */}

          <button
            type="button"
            onClick={save}
            disabled={saveDisabled || isReadOnly || !isUnsaved}
            title={isReadOnly ? "サンプルは保存できません" : undefined}
            className={`flex items-center gap-1.5 text-xs font-jp px-3 py-2 border rounded-sm transition ${isUnsaved
              ? "border-amber-500 text-amber-800 bg-amber-50 hover:bg-amber-100"
              : "border-stone-300 text-stone-500 cursor-default disabled:opacity-50"
              }`}
          >
            <Save size={14} /> {isUnsaved ? "保存*" : "保存"}
          </button>
        </div>
      </div>
    </header>
  );
}

function ThemePicker({ themeKey, onThemeChange }) {
  return (
    <details className="relative">
      <summary className="list-none cursor-pointer flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-300 rounded-sm text-stone-700 hover:bg-stone-200 transition">
        テーマ: {THEMES[themeKey]?.name || "Theme"} <ChevronDown size={13} />
      </summary>
      <div className="absolute right-0 mt-1 min-w-36 rounded-sm border border-stone-300 bg-stone-50 shadow-lg overflow-hidden z-50">
        {Object.entries(THEMES).map(([key, t]) => (
          <button
            key={key}
            type="button"
            onClick={() => onThemeChange(key)}
            className={`w-full text-left font-jp text-xs px-3 py-2 transition ${themeKey === key
              ? "bg-stone-900 text-stone-50"
              : "bg-stone-50 text-stone-700 hover:bg-stone-200"
              }`}
          >
            {t.name}
          </button>
        ))}
      </div>
    </details>
  );
}
