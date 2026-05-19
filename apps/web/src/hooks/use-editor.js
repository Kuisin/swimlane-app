import { useContext } from "react";
import { EditorContext } from "../context/editor-context-state.js";

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error("useEditor must be used within EditorProvider");
  }
  return ctx;
}
