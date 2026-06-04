const VARIANTS = {
  light: {
    border: "border-stone-200",
    save: "border-stone-800 bg-stone-900 text-stone-50 hover:bg-stone-800",
    reset: "border-stone-300 hover:bg-stone-100",
    delete: "text-red-700 border-red-300",
    referenced: "text-stone-500",
  },
  dark: {
    border: "border-stone-700",
    save: "border-stone-500 bg-stone-100 text-stone-900 hover:bg-white",
    reset: "border-stone-600 text-stone-300 hover:bg-stone-800",
    delete: "text-red-400 border-red-800",
    referenced: "text-stone-500",
  },
};

export function DraftActions({
  isDirty,
  onSave,
  onReset,
  onDelete,
  referenced,
  variant = "light",
}) {
  const styles = VARIANTS[variant];
  const base =
    "text-xs font-jp px-3 py-1.5 rounded border disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <>
      <div className={`flex flex-wrap gap-2 pt-2 border-t ${styles.border}`}>
        <button
          type="button"
          disabled={!isDirty}
          onClick={onSave}
          className={`${base} ${styles.save}`}
        >
          保存
        </button>
        <button
          type="button"
          disabled={!isDirty}
          onClick={onReset}
          className={`${base} ${styles.reset}`}
        >
          元に戻す
        </button>
        {onDelete && (
          <button
            type="button"
            disabled={referenced}
            onClick={onDelete}
            className={`${base} ${styles.delete} ml-auto`}
          >
            削除
          </button>
        )}
      </div>
      {referenced && onDelete && (
        <p className={`text-[10px] font-jp ${styles.referenced}`}>
          フローで使用中のため削除不可
        </p>
      )}
    </>
  );
}
