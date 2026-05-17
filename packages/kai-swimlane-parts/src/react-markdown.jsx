import { KaiSwimlanePartsPreview } from "./kai-swimlane-parts-preview.jsx";
import { FENCE_LANG } from "./constants.js";

/**
 * react-markdown `components.code` handler for ```kai-swimlane-parts fences.
 * @param {{ themeKey?: string }} options
 */
export function createKaiSwimlanePartsCodeComponent(options = {}) {
  const { themeKey = "basic" } = options;

  return function KaiSwimlanePartsCode({ className, children, ...props }) {
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
      <div className="kai-swimlane-parts-fence not-prose my-4">
        <KaiSwimlanePartsPreview
          code={code}
          themeKey={themeKey}
          className="rounded-md border border-stone-200 overflow-auto max-h-56 mb-2"
        />
        <pre className="overflow-auto rounded-md bg-stone-900 p-3 font-mono text-xs leading-relaxed text-stone-100 max-h-48">
          <code>{code}</code>
        </pre>
      </div>
    );
  };
}
