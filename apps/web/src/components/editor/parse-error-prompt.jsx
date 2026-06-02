import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export function ParseErrorPrompt({
  errors,
  onChooseFix,
  onChooseContinue,
}) {
  if (!errors?.length) return null;

  return (
    <div className="shrink-0 border-b border-amber-800/60 bg-amber-950/40 px-3 py-3 space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle
          size={18}
          className="text-amber-400 shrink-0 mt-0.5"
          aria-hidden
        />
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-jp text-amber-100 font-medium">
            構文エラーがあります
          </p>
          <p className="text-[11px] font-jp text-amber-200/90 leading-relaxed">
            GUI では安全のため編集できません。テキストエディタでエラー行を修正するか、プレビューのみ続行してください。
          </p>
        </div>
      </div>

      <ul className="max-h-28 overflow-auto font-mono text-[11px] text-red-300 space-y-0.5 pl-6">
        {errors.map((err, i) => (
          <li key={i}>
            L{err.line}: {err.msg}
            {err.text ? (
              <span className="text-red-400/80"> → {err.text.trim()}</span>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        <Link
          to="/"
          className="px-3 py-1.5 rounded-sm text-[11px] font-jp border border-amber-600 text-amber-100 bg-amber-900/50 hover:bg-amber-800/60 inline-block"
          onClick={onChooseFix}
        >
          テキストエディタで修正
        </Link>
        <button
          type="button"
          onClick={onChooseContinue}
          className="px-3 py-1.5 rounded-sm text-[11px] font-jp border border-stone-600 text-stone-300 hover:bg-stone-800"
        >
          続行（エラー行のブロックのみ編集不可）
        </button>
      </div>
    </div>
  );
}
