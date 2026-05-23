import { useRef } from "react";
import { openTemplatePopup } from "../../lib/open-template-popup";

const buttonClass =
  "text-xs font-jp px-3 py-2 border border-stone-300 rounded-sm hover:bg-stone-200";

export function ToolbarTemplateActions() {
  const templatePopupRefs = useRef({});

  return (
    <>
      <button
        type="button"
        onClick={() => openTemplatePopup("roles", templatePopupRefs)}
        className={buttonClass}
      >
        役割
      </button>
      <button
        type="button"
        onClick={() => openTemplatePopup("blocks", templatePopupRefs)}
        className={buttonClass}
      >
        ブロック
      </button>
      <button
        type="button"
        onClick={() => openTemplatePopup("props", templatePopupRefs)}
        className={buttonClass}
      >
        プロップ
      </button>
    </>
  );
}
