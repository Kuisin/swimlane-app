import { useMemo, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { parseHelpMd, parseTemplateMd } from "@kai-swimlane/core";
import { KaiSwimlanePreview } from "kai-swimlane";
import { KaiSwimlanePartsPreview } from "kai-swimlane-parts";

const CATEGORY_LABELS = {
  role: "役割",
  block: "ブロック",
  prop: "プロップ",
  set: "セット",
};

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

function CopyButton({ copied, onCopy, className = "" }) {
  return (
    <button
      type="button"
      onClick={onCopy}
      className={`flex items-center gap-1.5 rounded-sm border border-stone-300 px-2.5 py-1.5 text-xs font-jp text-stone-700 transition hover:bg-stone-200 shrink-0 ${className}`}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "コピー済み" : "コピー"}
    </button>
  );
}

function DslPre({ code }) {
  return (
    <pre className="overflow-auto rounded-md bg-stone-900 p-3 font-mono text-xs leading-relaxed text-stone-100 max-h-48">
      {code}
    </pre>
  );
}

function TemplateDescription({ desc }) {
  if (!desc) return null;
  return <p className="text-xs text-stone-600 font-jp leading-relaxed mb-2">{desc}</p>;
}

function TemplateCardHeader({ item, copiedId, onCopy }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-2">
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-stone-900">{item.title}</h3>
        <TemplateDescription desc={item.desc} />
      </div>
      <CopyButton
        copied={copiedId === item.id}
        onCopy={() => onCopy(item.id, item.code)}
      />
    </div>
  );
}

function TemplateSnippetRow({ item, copiedId, onCopy }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm">
      <TemplateCardHeader item={item} copiedId={copiedId} onCopy={onCopy} />
      <DslPre code={item.code} />
    </section>
  );
}

function TemplatePartsPreviewCard({ item, themeKey, copiedId, onCopy }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm">
      <TemplateCardHeader item={item} copiedId={copiedId} onCopy={onCopy} />
      <KaiSwimlanePartsPreview
        code={item.code}
        themeKey={themeKey}
        className="rounded-md border border-stone-200 overflow-auto max-h-56 mb-2"
      />
      <DslPre code={item.code} />
    </section>
  );
}

function TemplateFullPreviewCard({ item, themeKey, copiedId, onCopy }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm">
      <TemplateCardHeader item={item} copiedId={copiedId} onCopy={onCopy} />
      <KaiSwimlanePreview
        code={item.code}
        themeKey={themeKey}
        className="rounded-md border border-stone-200 overflow-auto max-h-60 mb-2"
      />
      <DslPre code={item.code} />
    </section>
  );
}

function TemplateItem({ item, themeKey, copiedId, onCopy }) {
  if (item.preview === "full") {
    return (
      <TemplateFullPreviewCard
        item={item}
        themeKey={themeKey}
        copiedId={copiedId}
        onCopy={onCopy}
      />
    );
  }
  if (item.preview === "parts") {
    return (
      <TemplatePartsPreviewCard
        item={item}
        themeKey={themeKey}
        copiedId={copiedId}
        onCopy={onCopy}
      />
    );
  }
  return (
    <TemplateSnippetRow item={item} copiedId={copiedId} onCopy={onCopy} />
  );
}

export function HelpModal({ helpMd, templateMd, themeKey, onClose }) {
  const [mainTab, setMainTab] = useState("guide");
  const [categoryId, setCategoryId] = useState("role");
  const [copiedGuide, setCopiedGuide] = useState(false);
  const [copiedTemplateId, setCopiedTemplateId] = useState(null);

  const sections = useMemo(() => parseHelpMd(helpMd), [helpMd]);
  const categories = useMemo(() => parseTemplateMd(templateMd), [templateMd]);
  const activeCategory =
    categories.find((c) => c.id === categoryId) || categories[0];

  const aiPrompt = `***
  以下に従って、DSL形式のコードを作成してください。内容を厳守し、構造を壊さずに回答してください。

`;

  async function copyRuleAsMarkdown() {
    await navigator.clipboard.writeText(`${aiPrompt}${helpMd}`);
    setCopiedGuide(true);
    setTimeout(() => setCopiedGuide(false), 1500);
  }

  async function copyTemplate(id, code) {
    await navigator.clipboard.writeText(code);
    setCopiedTemplateId(id);
    setTimeout(() => setCopiedTemplateId(null), 1500);
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
            <h2 className="font-display text-xl font-bold">ヘルプ</h2>
            {mainTab === "guide" ? (
              <button
                type="button"
                onClick={copyRuleAsMarkdown}
                className="flex items-center gap-1.5 rounded-sm border border-stone-300 px-3 py-2 text-xs font-jp text-stone-700 transition hover:bg-stone-200"
              >
                {copiedGuide ? <Check size={14} /> : <Copy size={14} />}
                {copiedGuide ? "コピー済み" : "AI用プロンプトをコピー"}
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-500 hover:text-stone-900"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-stone-300 px-5 gap-1">
          <button
            type="button"
            onClick={() => setMainTab("guide")}
            className={`px-4 py-2.5 text-sm font-jp font-medium border-b-2 -mb-px transition ${
              mainTab === "guide"
                ? "border-stone-800 text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-700"
            }`}
          >
            構文ガイド
          </button>
          <button
            type="button"
            onClick={() => setMainTab("templates")}
            className={`px-4 py-2.5 text-sm font-jp font-medium border-b-2 -mb-px transition ${
              mainTab === "templates"
                ? "border-stone-800 text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-700"
            }`}
          >
            テンプレート
          </button>
        </div>

        {mainTab === "templates" && categories.length > 0 ? (
          <div className="flex flex-wrap gap-2 px-5 pt-3 border-b border-stone-200 pb-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`px-3 py-1.5 text-xs font-jp rounded-sm border transition ${
                  categoryId === cat.id
                    ? "bg-stone-800 text-stone-50 border-stone-800"
                    : "bg-white text-stone-600 border-stone-300 hover:bg-stone-100"
                }`}
              >
                {CATEGORY_LABELS[cat.id] || cat.id}
              </button>
            ))}
          </div>
        ) : null}

        <div className="max-h-[70vh] space-y-4 overflow-auto p-5 font-jp text-sm text-stone-700">
          {mainTab === "guide"
            ? sections.map((section, i) => (
                <HelpSection
                  key={i}
                  title={section.title}
                  code={section.code}
                  desc={section.desc}
                />
              ))
            : (activeCategory?.items || []).map((item) => (
                <TemplateItem
                  key={item.id}
                  item={item}
                  themeKey={themeKey}
                  copiedId={copiedTemplateId}
                  onCopy={copyTemplate}
                />
              ))}
        </div>
      </div>
    </div>
  );
}
