import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { AlignLeft, Check, Copy, Save } from "lucide-react";
import { applyTabIndent } from "../lib/editor-indent.js";
import { formatDsl } from "../lib/format-dsl.js";
import { ExportMenu } from "./export-menu.jsx";

export function EditorPanel({
  src,
  onChange,
  model,
  modelTitle,
  themeBg,
  hasUnsavedChanges,
  onSave,
}) {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const lineCount = useMemo(() => {
    if (!src) return 1;
    return src.split("\n").length;
  }, [src]);
  const lineNumbers = useMemo(
    () => Array.from({ length: lineCount }, (_, i) => i + 1),
    [lineCount],
  );
  const errorLines = useMemo(
    () => new Set(model.errors.map((e) => e.line)),
    [model.errors],
  );
  const stepCount = model.rows.filter((r) => r.kind === "step").length;
  const highlightsRef = useRef(null);
  const pendingSelectionRef = useRef(null);

  useLayoutEffect(() => {
    const pending = pendingSelectionRef.current;
    const textarea = textareaRef.current;
    if (!pending || !textarea) return;
    textarea.selectionStart = pending.start;
    textarea.selectionEnd = pending.end;
    pendingSelectionRef.current = null;
  }, [src]);

  function handleEditorKeyDown(e) {
    if (e.key !== "Tab") return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    e.preventDefault();
    const result = applyTabIndent(
      src,
      textarea.selectionStart,
      textarea.selectionEnd,
      e.shiftKey,
    );
    if (!result) return;

    pendingSelectionRef.current = {
      start: result.selectionStart,
      end: result.selectionEnd,
    };
    onChange(result.value);
  }

  function syncEditorScroll() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { scrollTop } = textarea;
    if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = scrollTop;
    if (highlightsRef.current) highlightsRef.current.scrollTop = scrollTop;
  }
  const blockCount = Object.keys(model.blocks || {}).length;

  const canFormat = model.errors.length === 0;

  function handleFormat() {
    const result = formatDsl(src);
    if (!result.ok || result.value === src) return;
    onChange(result.value);
  }

  async function copyDSL() {
    await navigator.clipboard.writeText(src);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="relative z-10 px-4 py-2 border-b border-stone-700/60 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 shrink-0">
        <div className="flex items-center gap-4 min-w-0 basis-full sm:basis-auto">
          {/* <span className="font-mono text-xs text-stone-400 tracking-wider uppercase">
            editor
          </span> */}
          <div className="flex items-center gap-1 font-mono text-[10px] text-stone-500">
            <span>{model.lanes.length} roles</span>
            <span className="text-stone-700">·</span>
            <span>{blockCount} blocks</span>
            <span className="text-stone-700">·</span>
            <span>{stepCount} steps</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 ml-auto">
          <ExportMenu src={src} modelTitle={modelTitle} themeBg={themeBg} />
          <button
            type="button"
            onClick={handleFormat}
            disabled={!canFormat}
            title={
              canFormat
                ? "DSLを整形"
                : "解析エラーを修正してから整形できます"
            }
            className="flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-700 rounded-sm text-stone-300 hover:bg-stone-800 transition disabled:opacity-40 disabled:pointer-events-none disabled:hover:bg-transparent"
          >
            <AlignLeft size={14} />
            整形
          </button>
          <button
            type="button"
            onClick={copyDSL}
            className="flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-700 rounded-sm text-stone-300 hover:bg-stone-800 transition"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "済" : "コピー"}
          </button>
          <button
            type="button"
            onClick={onSave}
            className={`flex items-center gap-1.5 text-xs font-jp px-3 py-2 border rounded-sm transition ${hasUnsavedChanges
                ? "border-amber-500 text-amber-300 bg-amber-950/40 hover:bg-amber-900/40"
                : "border-stone-700 text-stone-300 hover:bg-stone-800"
              }`}
          >
            <Save size={14} /> {hasUnsavedChanges ? "保存*" : "保存"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div
          ref={lineNumbersRef}
          className="shrink-0 overflow-hidden py-4 pl-2 pr-4 select-none border-r border-stone-700/40"
          aria-hidden
        >
          <div
            className="font-mono text-sm leading-relaxed text-stone-500 text-right tabular-nums"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {lineNumbers.map((n) => (
              <div
                key={n}
                className={
                  errorLines.has(n)
                    ? "text-red-400 bg-red-950/50 -mx-2 px-2 rounded-sm"
                    : undefined
                }
              >
                {n}
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex-1 min-w-0 min-h-0">
          <div
            ref={highlightsRef}
            className="absolute inset-0 overflow-hidden pointer-events-none"
            aria-hidden
          >
            <div
              className="py-4 pl-4 pr-2 font-mono text-sm leading-relaxed"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {lineNumbers.map((n) => (
                <div
                  key={n}
                  className={
                    errorLines.has(n) ? "bg-red-950/45 rounded-sm" : undefined
                  }
                >
                  {"\u00a0"}
                </div>
              ))}
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={src}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleEditorKeyDown}
            onScroll={syncEditorScroll}
            spellCheck={false}
            className="relative z-10 w-full h-full py-4 pl-4 pr-2 bg-transparent text-stone-100 font-mono text-sm leading-relaxed outline-none resize-none"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          />
        </div>
      </div>

      {model.errors.length > 0 && (
        <div className="border-t border-red-900/50 bg-red-950/30 p-3 max-h-48 overflow-auto shrink-0">
          <div className="font-mono text-[10px] text-red-400 uppercase tracking-wider mb-1.5">
            解析エラー
          </div>
          {model.errors.map((e, i) => (
            <div key={i} className="font-mono text-xs text-red-300">
              L{e.line}: {e.msg} → {e.text.trim()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
