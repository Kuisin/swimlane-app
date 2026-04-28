import { useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { parseHelpMd } from "../lib/utils";

function HelpSection({ title, code, desc }) {
  return (
    <div>
      <div className="font-bold text-stone-900 mb-1">{title}</div>
      <pre className="bg-stone-900 text-stone-100 p-3 rounded-sm font-mono text-xs overflow-auto whitespace-pre">
        {code}
      </pre>
      <div className="mt-1.5 text-xs text-stone-600">{desc}</div>
    </div>
  );
}

export function HelpModal({ helpMd, onClose }) {
  const [copied, setCopied] = useState(false);
  const sections = parseHelpMd(helpMd);

  async function copyRuleAsMarkdown() {
    await navigator.clipboard.writeText(helpMd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className="fixed inset-0 bg-stone-900/70 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-stone-50 max-w-2xl w-full rounded-sm shadow-2xl border border-stone-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-300">
          <div className="flex items-center gap-4">
            <h2 className="font-display text-xl font-bold">構文ガイド</h2>
            <button
              onClick={copyRuleAsMarkdown}
              className="flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-300 rounded-sm text-stone-700 hover:bg-stone-200 transition"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "コピー済み" : "AI用MDをコピー"}
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-900"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4 font-jp text-sm text-stone-700 max-h-[70vh] overflow-auto">
          {sections.map((section, i) => (
            <HelpSection
              key={i}
              title={section.title}
              code={section.code}
              desc={section.desc}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
