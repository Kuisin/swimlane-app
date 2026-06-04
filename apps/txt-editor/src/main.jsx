import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FileEditorProvider } from "./context/file-editor-provider";
import { App } from "./app";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <FileEditorProvider>
      <App />
    </FileEditorProvider>
  </StrictMode>,
);
