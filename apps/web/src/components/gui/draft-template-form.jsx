import { useEffect } from "react";
import { useTemplateDraft } from "../../hooks/use-template-draft";

export function DraftTemplateForm({
  item,
  onSave,
  onDelete,
  referenced,
  onDirtyChange,
  children,
}) {
  const { draft, patch, isDirty, reset } = useTemplateDraft(item);

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  if (!draft) return null;

  return (
    <div className="space-y-2">
      {children({ draft, patch })}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-200">
        <button
          type="button"
          disabled={!isDirty}
          onClick={() => onSave(draft)}
          className="text-xs font-jp px-3 py-1.5 rounded border border-stone-800 bg-stone-900 text-stone-50 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          保存
        </button>
        <button
          type="button"
          disabled={!isDirty}
          onClick={reset}
          className="text-xs font-jp px-3 py-1.5 rounded border border-stone-300 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          元に戻す
        </button>
        {onDelete && (
          <button
            type="button"
            disabled={referenced}
            onClick={onDelete}
            className="text-xs font-jp text-red-700 border border-red-300 px-2 py-1 rounded disabled:opacity-40 ml-auto"
          >
            削除
          </button>
        )}
      </div>
      {referenced && onDelete && (
        <p className="text-[10px] text-stone-500 font-jp">
          フローで使用中のため削除不可
        </p>
      )}
    </div>
  );
}
