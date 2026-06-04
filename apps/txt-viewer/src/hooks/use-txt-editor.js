import { useContext } from "react";
import { EditorContext } from "@web/context/editor-context";

export function useTxtEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error("useTxtEditor must be used within TxtEditorProvider");
  }
  if (typeof ctx.openFolder !== "function") {
    throw new Error("useTxtEditor requires TxtEditorProvider");
  }
  return ctx;
}
