import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { EditorProvider } from "./context/editor-provider";
import { EditorPage } from "./pages/editor-page";
import { GuiPage } from "./pages/gui-page";
import { TemplatePopupPage } from "./pages/template-popup-page";
import { StepInspectorPopupPage } from "./pages/step-inspector-popup-page";
import { restoreSpaPathFrom404 } from "./lib/spa-redirect";

restoreSpaPathFrom404();

const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <EditorProvider>
        <Routes>
          <Route path="/" element={<EditorPage />} />
          <Route path="/gui" element={<GuiPage />} />
          <Route path="/gui/templates/:kind" element={<TemplatePopupPage />} />
          <Route path="/gui/step-inspector" element={<StepInspectorPopupPage />} />
        </Routes>
      </EditorProvider>
    </BrowserRouter>
  </StrictMode>
);
