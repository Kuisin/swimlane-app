import { useState, useMemo } from "react";
import SAMPLE from "./sample.txt?raw";
import HELP_MD from "./help.md?raw";
import { parseDSL } from "./lib/parser";
import { THEMES } from "./lib/themes";
import { Diagram } from "./components/diagram/diagram";
import { EditorPanel } from "./components/editor-panel";
import { Toolbar } from "./components/toolbar";
import { HelpModal } from "./components/help-modal";

export default function App() {
  const [src, setSrc] = useState(SAMPLE);
  const [themeKey, setThemeKey] = useState("basic");
  const [showHelp, setShowHelp] = useState(false);

  const theme = THEMES[themeKey];
  const model = useMemo(() => parseDSL(src), [src]);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;600;700&family=Noto+Sans+JP:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Shippori Mincho', serif; }
        .font-jp { font-family: 'Noto Sans JP', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
      `}</style>

      <Toolbar
        themeKey={themeKey}
        onThemeChange={setThemeKey}
        theme={theme}
        modelTitle={model.title}
        src={src}
        onShowHelp={() => setShowHelp(true)}
      />

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2">
        <div className="bg-stone-100 p-6 overflow-auto">
          <div
            className="rounded-sm shadow-lg border border-stone-300 overflow-hidden"
            style={{ background: theme.bg }}
          >
            <Diagram model={model} theme={theme} />
          </div>
          <div className="mt-3 font-jp text-[11px] text-stone-500 flex justify-between">
            <span>プレビュー · Preview</span>
            <span>{model.title}</span>
          </div>
        </div>

        <div className="border-r border-stone-300 bg-stone-900 text-stone-100 flex flex-col min-h-[calc(100vh-73px)]">
          <EditorPanel src={src} onChange={setSrc} model={model} />
        </div>
      </div>

      {showHelp && (
        <HelpModal helpMd={HELP_MD} onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
}
