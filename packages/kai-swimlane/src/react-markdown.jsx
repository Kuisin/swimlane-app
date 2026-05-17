import { KaiSwimlanePreview } from "./kai-swimlane-preview.jsx";
import { FENCE_LANG } from "./constants.js";

/**
 * react-markdown `components.code` handler for ```kai-swimlane fences.
 * @param {{ themeKey?: string, showStepBlockCaptions?: boolean }} options
 */
export function createKaiSwimlaneCodeComponent(options = {}) {
  const { themeKey = "basic", showStepBlockCaptions = false } = options;

  return function KaiSwimlaneCode({ className, children, ...props }) {
    const match = /language-(\S+)/.exec(className || "");
    if (match?.[1] !== FENCE_LANG) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }

    const code = String(children).replace(/\n$/, "");
    return (
      <div className="kai-swimlane-fence not-prose my-4">
        <KaiSwimlanePreview
          code={code}
          themeKey={themeKey}
          showStepBlockCaptions={showStepBlockCaptions}
          className="rounded-md border border-stone-200 overflow-auto max-h-60 mb-2"
        />
        <pre className="overflow-auto rounded-md bg-stone-900 p-3 font-mono text-xs leading-relaxed text-stone-100 max-h-48">
          <code>{code}</code>
        </pre>
      </div>
    );
  };
}
