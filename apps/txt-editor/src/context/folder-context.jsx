import { createContext, useContext } from "react";

export const FolderContext = createContext(null);

export function useFolder() {
  const ctx = useContext(FolderContext);
  if (!ctx) {
    throw new Error("useFolder must be used within FileEditorProvider");
  }
  return ctx;
}
