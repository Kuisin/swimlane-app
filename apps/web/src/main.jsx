import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { EditorProvider } from "./context/editor-context";
import { EditorPage } from "./pages/editor-page";
import { GuiPage } from "./pages/gui-page";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <EditorProvider>
        <Routes>
          <Route path="/" element={<EditorPage />} />
          <Route path="/gui" element={<GuiPage />} />
        </Routes>
      </EditorProvider>
    </BrowserRouter>
  </StrictMode>
);
