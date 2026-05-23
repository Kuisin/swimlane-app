import { useState } from "react";
import { AlignLeft, Check, Copy } from "lucide-react";
import { formatDsl } from "../../lib/format-dsl";

const BUTTON_BASE =
  "flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-700 rounded-sm text-stone-300 hover:bg-stone-800 transition";

export function FormatActions({ src, onChange, canFormat }) {
  const [copied, setCopied] = useState(false);

  function handleFormat() {
    const result = formatDsl(src);
    if (!result.ok || result.value === src) return;
    onChange(result.value);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(src);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleFormat}
        disabled={!canFormat}
        title={
          canFormat ? "DSLを整形" : "解析エラーを修正してから整形できます"
        }
        className={`${BUTTON_BASE} disabled:opacity-40 disabled:pointer-events-none disabled:hover:bg-transparent`}
      >
        <AlignLeft size={14} />
        整形
      </button>
      <button type="button" onClick={handleCopy} className={BUTTON_BASE}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "済" : "コピー"}
      </button>
    </>
  );
}
