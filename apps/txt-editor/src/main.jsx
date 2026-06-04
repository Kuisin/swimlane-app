import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppDialogProvider } from "./context/app-dialog-provider";
import { FileEditorProvider } from "./context/file-editor-provider";
import { App } from "./app";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppDialogProvider>
      <FileEditorProvider>
        <App />
      </FileEditorProvider>
    </AppDialogProvider>
  </StrictMode>,
);
