import { useState } from "react";
import { Check, Copy, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { parseHelpMd } from "../lib/utils";

function HelpSection({ title, code, desc }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm">
      <h3 className="text-sm font-bold text-stone-900">{title}</h3>
      {code ? (
        <pre className="mt-2 overflow-auto rounded-md bg-stone-900 p-3 font-mono text-xs leading-relaxed text-stone-100">
          {code}
        </pre>
      ) : null}
      {desc ? (
        <div className="prose prose-sm prose-stone mt-2 max-w-none text-stone-700">
          <ReactMarkdown
            components={{
              a: ({ ...props }) => (
                <a
                  {...props}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-800"
                />
              ),
              code: ({ ...props }) => (
                <code
                  {...props}
                  className="rounded bg-stone-100 px-1 py-0.5 font-mono text-[0.78rem] text-stone-800"
                />
              ),
            }}
          >
            {desc}
          </ReactMarkdown>
        </div>
      ) : null}
    </section>
  );
}

export function HelpModal({ helpMd, onClose }) {
  const [copied, setCopied] = useState(false);
  const sections = parseHelpMd(helpMd);
  const aiPrompt = `***
  以下に従って、DSL形式のコードを作成してください。内容を厳守し、構造を壊さずに回答してください。

`;

  async function copyRuleAsMarkdown() {
    await navigator.clipboard.writeText(`${aiPrompt}${helpMd}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl overflow-hidden rounded-xl border border-stone-300 bg-stone-50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-300 px-5 py-4">
          <div className="flex items-center gap-4">
            <h2 className="font-display text-xl font-bold">構文ガイド</h2>
            <button
              onClick={copyRuleAsMarkdown}
              className="flex items-center gap-1.5 rounded-sm border border-stone-300 px-3 py-2 text-xs font-jp text-stone-700 transition hover:bg-stone-200"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "コピー済み" : "AI用プロンプトをコピー"}
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-900"
          >
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[75vh] space-y-4 overflow-auto p-5 font-jp text-sm text-stone-700">
          {/* <HelpMarkdownSection helpMd={helpMd} /> */}
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
