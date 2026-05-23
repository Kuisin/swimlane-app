import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import { downloadDslTxt } from "../../lib/dsl-file";
import { downloadPNG, downloadSVG } from "../../lib/export";

export function ExportMenu({
  src,
  modelTitle,
  themeBg,
  showStepBlockCaptions = true,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function handleDownloadSvg() {
    downloadSVG(modelTitle, { includeStepBlockCaptions: showStepBlockCaptions });
    setOpen(false);
  }

  function handleDownloadPng() {
    downloadPNG(modelTitle, themeBg, {
      includeStepBlockCaptions: showStepBlockCaptions,
    });
    setOpen(false);
  }

  function handleDownloadTxt() {
    downloadDslTxt(src, modelTitle);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-700 rounded-sm text-stone-300 hover:bg-stone-800 transition whitespace-nowrap"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Download size={14} /> 出力 <ChevronDown size={13} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-28 rounded-sm border border-stone-700 bg-stone-900 shadow-lg overflow-hidden z-50"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleDownloadSvg}
            className="w-full text-left px-3 py-2 text-xs font-jp text-stone-200 hover:bg-stone-800"
          >
            SVG
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleDownloadPng}
            className="w-full text-left px-3 py-2 text-xs font-jp text-stone-200 hover:bg-stone-800"
          >
            PNG
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleDownloadTxt}
            className="w-full text-left px-3 py-2 text-xs font-jp text-stone-200 hover:bg-stone-800"
          >
            TXT
          </button>
        </div>
      )}
    </div>
  );
}
