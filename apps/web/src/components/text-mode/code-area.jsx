import { useLayoutEffect, useMemo, useRef } from "react";
import { applyTabIndent } from "../../lib/editor-indent";

const MONO_FONT = {
  fontFamily: "'JetBrains Mono', monospace",
  whiteSpace: "pre",
};

export function CodeArea({ src, onChange, errorLines = new Set() }) {
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const highlightsRef = useRef(null);
  const pendingSelectionRef = useRef(null);

  const lineNumbers = useMemo(() => {
    const count = src ? src.split("\n").length : 1;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [src]);

  useLayoutEffect(() => {
    const pending = pendingSelectionRef.current;
    const textarea = textareaRef.current;
    if (!pending || !textarea) return;
    textarea.selectionStart = pending.start;
    textarea.selectionEnd = pending.end;
    pendingSelectionRef.current = null;
  }, [src]);

  function handleKeyDown(event) {
    if (event.key !== "Tab") return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    event.preventDefault();
    const result = applyTabIndent(
      src,
      textarea.selectionStart,
      textarea.selectionEnd,
      event.shiftKey
    );
    if (!result) return;

    pendingSelectionRef.current = {
      start: result.selectionStart,
      end: result.selectionEnd,
    };
    onChange(result.value);
  }

  function syncScroll() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { scrollTop, scrollLeft } = textarea;
    if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = scrollTop;
    if (highlightsRef.current) {
      highlightsRef.current.scrollTop = scrollTop;
      highlightsRef.current.scrollLeft = scrollLeft;
    }
  }

  function handleLineNumbersWheel(event) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.scrollTop += event.deltaY;
    textarea.scrollLeft += event.deltaX;
    syncScroll();
    event.preventDefault();
  }

  useLayoutEffect(() => {
    syncScroll();
  }, [src, lineNumbers.length]);

  return (
    <div className="flex flex-1 min-h-0">
      <div
        ref={lineNumbersRef}
        onWheel={handleLineNumbersWheel}
        className="shrink-0 overflow-hidden py-4 pl-2 pr-4 select-none border-r border-stone-700/40"
        aria-hidden
      >
        <div
          className="font-mono text-sm leading-relaxed text-stone-500 text-right tabular-nums"
          style={MONO_FONT}
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
            className="py-4 pl-4 pr-2 font-mono text-sm leading-relaxed w-max min-w-full"
            style={MONO_FONT}
          >
            {lineNumbers.map((n) => (
              <div
                key={n}
                className={
                  errorLines.has(n) ? "bg-red-950/45 rounded-sm"
                    : undefined
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
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          spellCheck={false}
          wrap="off"
          className="relative z-10 block w-full h-full min-w-0 py-4 pl-4 pr-2 bg-transparent text-stone-100 font-mono text-sm leading-relaxed outline-none resize-none overflow-auto"
          style={MONO_FONT}
        />
      </div>
    </div>
  );
}
