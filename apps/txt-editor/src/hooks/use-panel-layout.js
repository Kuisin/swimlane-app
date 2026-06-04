import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "txt-editor.panelLayout";

export const PANEL_LIMITS = {
  folderWidth: { min: 140, max: 480, default: 208 },
  editorWidth: { min: 280, max: 720, default: 420 },
  inspectorHeight: { min: 120, max: 480, default: 288 },
};

function clamp(value, { min, max }) {
  return Math.min(max, Math.max(min, value));
}

function loadLayout() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultLayout();
    const parsed = JSON.parse(raw);
    return {
      folderWidth: clamp(
        Number(parsed.folderWidth) || PANEL_LIMITS.folderWidth.default,
        PANEL_LIMITS.folderWidth,
      ),
      editorWidth: clamp(
        Number(parsed.editorWidth) || PANEL_LIMITS.editorWidth.default,
        PANEL_LIMITS.editorWidth,
      ),
      inspectorHeight: clamp(
        Number(parsed.inspectorHeight) || PANEL_LIMITS.inspectorHeight.default,
        PANEL_LIMITS.inspectorHeight,
      ),
    };
  } catch {
    return getDefaultLayout();
  }
}

function getDefaultLayout() {
  return {
    folderWidth: PANEL_LIMITS.folderWidth.default,
    editorWidth: PANEL_LIMITS.editorWidth.default,
    inspectorHeight: PANEL_LIMITS.inspectorHeight.default,
  };
}

export function usePanelLayout() {
  const [layout, setLayout] = useState(loadLayout);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {
      /* ignore quota errors */
    }
  }, [layout]);

  const beginResize = useCallback((panel, event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startLayout = layout;

    function onMove(ev) {
      setLayout((current) => {
        if (panel === "folder") {
          const delta = ev.clientX - startX;
          return {
            ...current,
            folderWidth: clamp(
              startLayout.folderWidth + delta,
              PANEL_LIMITS.folderWidth,
            ),
          };
        }
        if (panel === "editor") {
          const delta = startX - ev.clientX;
          return {
            ...current,
            editorWidth: clamp(
              startLayout.editorWidth + delta,
              PANEL_LIMITS.editorWidth,
            ),
          };
        }
        if (panel === "inspector") {
          const delta = startY - ev.clientY;
          return {
            ...current,
            inspectorHeight: clamp(
              startLayout.inspectorHeight + delta,
              PANEL_LIMITS.inspectorHeight,
            ),
          };
        }
        return current;
      });
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    const cursor =
      panel === "inspector" ? "row-resize" : "col-resize";
    document.body.style.cursor = cursor;
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [layout]);

  return { layout, beginResize };
}
