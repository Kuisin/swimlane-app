export function ResizeHandle({ orientation, onMouseDown, className = "" }) {
  const isVertical = orientation === "vertical";

  return (
    <div
      role="separator"
      aria-orientation={isVertical ? "vertical" : "horizontal"}
      title="ドラッグしてサイズを変更"
      onMouseDown={onMouseDown}
      className={[
        "shrink-0 z-10 touch-none select-none",
        "bg-stone-200/80 hover:bg-stone-300 active:bg-stone-400 transition-colors",
        isVertical
          ? "w-1.5 cursor-col-resize self-stretch min-h-0"
          : "h-1.5 cursor-row-resize w-full",
        className,
      ].join(" ")}
    />
  );
}
