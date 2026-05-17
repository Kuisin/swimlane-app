import { useMemo, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  parseDSL,
  parseHelpMd,
  parseTemplateMd,
  THEMES,
} from "@kai-swimlane/core";
import { KaiSwimlanePreview } from "kai-swimlane";
import { KaiSwimlanePartsPreview } from "kai-swimlane-parts";

const CATEGORY_LABELS = {
  role: "役割",
  block: "ブロック",
  prop: "プロップ",
  set: "セット",
};

const CARD_CLASS =
  "rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm";

const MARKDOWN_COMPONENTS = {
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
};

function MarkdownBody({ children, className = "" }) {
  if (!children?.trim()) return null;
  return (
    <div
      className={`prose prose-sm prose-stone max-w-none text-stone-700 ${className}`}
    >
      <ReactMarkdown components={MARKDOWN_COMPONENTS}>{children}</ReactMarkdown>
    </div>
  );
}

function HelpSection({ title, code, desc }) {
  return (
    <section className={CARD_CLASS}>
      <h3 className="text-sm font-bold text-stone-900">{title}</h3>
      {code ? (
        <pre className="mt-2 overflow-auto rounded-md bg-stone-900 p-3 font-mono text-xs leading-relaxed text-stone-100">
          {code}
        </pre>
      ) : null}
      <MarkdownBody className="mt-2">{desc}</MarkdownBody>
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

function TemplateCardHeader({ item, copiedId, onCopy }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-2">
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-stone-900">{item.title}</h3>
        <MarkdownBody className="mt-1 text-xs">{item.desc}</MarkdownBody>
      </div>
      <CopyButton
        copied={copiedId === item.id}
        onCopy={() => onCopy(item.id, item.code)}
      />
    </div>
  );
}

function RoleLanePreview({ code, theme }) {
  const role = useMemo(() => {
    const wrapped = `@kai-swimlane\n/title/\n\n/role/\n${code.trim()}\n/line/\n@end\n`;
    const model = parseDSL(wrapped);
    if (model.errors.length > 0) return null;
    const id = Object.keys(model.roles)[0];
    return id ? model.roles[id] : null;
  }, [code]);

  if (!role) return null;

  const bg = role.bg || "#f5f5f4";
  const color = role.textColor || "#1e293b";

  return (
    <div
      className="rounded-md border border-stone-200 overflow-hidden mb-2"
      style={{ background: theme.bg }}
    >
      <div
        className="px-4 py-2.5 font-jp text-sm font-medium"
        style={{ background: bg, color }}
      >
        {role.label || role.id}
      </div>
      <p className="px-3 py-1.5 font-mono text-[10px] text-stone-500 border-t border-stone-100 bg-white/60">
        {role.id}
      </p>
    </div>
  );
}

function TemplateSnippetRow({ item, copiedId, onCopy }) {
  return (
    <section className={CARD_CLASS}>
      <TemplateCardHeader item={item} copiedId={copiedId} onCopy={onCopy} />
      <DslPre code={item.code} />
    </section>
  );
}

function TemplatePartsPreviewCard({ item, themeKey, copiedId, onCopy }) {
  return (
    <section className={CARD_CLASS}>
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

function TemplateRolePreviewCard({ item, themeKey, copiedId, onCopy, theme }) {
  return (
    <section className={CARD_CLASS}>
      <TemplateCardHeader item={item} copiedId={copiedId} onCopy={onCopy} />
      <RoleLanePreview code={item.code} theme={theme} />
      <DslPre code={item.code} />
    </section>
  );
}

function TemplateFullPreviewCard({ item, themeKey, copiedId, onCopy }) {
  return (
    <section className={CARD_CLASS}>
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

function resolveTemplatePreview(item, categoryId) {
  if (item.preview === "full") return "full";
  if (categoryId === "role") return "role";
  if (item.preview === "parts") return "parts";
  return "snippet";
}

function TemplateItem({ item, categoryId, themeKey, theme, copiedId, onCopy }) {
  const preview = resolveTemplatePreview(item, categoryId);
  if (preview === "full") {
    return (
      <TemplateFullPreviewCard
        item={item}
        themeKey={themeKey}
        copiedId={copiedId}
        onCopy={onCopy}
      />
    );
  }
  if (preview === "role") {
    return (
      <TemplateRolePreviewCard
        item={item}
        themeKey={themeKey}
        theme={theme}
        copiedId={copiedId}
        onCopy={onCopy}
      />
    );
  }
  if (preview === "parts") {
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

  const theme = THEMES[themeKey] || THEMES.basic;
  const sections = useMemo(() => parseHelpMd(helpMd), [helpMd]);
  const categories = useMemo(() => parseTemplateMd(templateMd), [templateMd]);
  const activeCategory =
    categories.find((c) => c.id === categoryId) || categories[0];

  const aiPrompt = `***
以下に従って、DSL形式のコードを作成してください。内容を厳守し、構造を壊さずに回答してください。

`;

  const aiPromptBody = `${helpMd}\n\n---\n\n${templateMd}`;

  async function copyRuleAsMarkdown() {
    await navigator.clipboard.writeText(`${aiPrompt}${aiPromptBody}`);
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
            <button
              type="button"
              onClick={copyRuleAsMarkdown}
              className="flex items-center gap-1.5 rounded-sm border border-stone-300 px-3 py-2 text-xs font-jp text-stone-700 transition hover:bg-stone-200"
            >
              {copiedGuide ? <Check size={14} /> : <Copy size={14} />}
              {copiedGuide ? "コピー済み" : "AI用プロンプトをコピー"}
            </button>
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
          {mainTab === "guide" ? (
            sections.map((section, i) => (
              <HelpSection
                key={i}
                title={section.title}
                code={section.code}
                desc={section.desc}
              />
            ))
          ) : categories.length === 0 ? (
            <p className="text-sm text-stone-500">テンプレートがありません。</p>
          ) : (
            <>
              {activeCategory?.intro ? (
                <section className={CARD_CLASS}>
                  <MarkdownBody>{activeCategory.intro}</MarkdownBody>
                </section>
              ) : null}
              {(activeCategory?.items || []).map((item) => (
                <TemplateItem
                  key={item.id}
                  item={item}
                  categoryId={activeCategory?.id}
                  themeKey={themeKey}
                  theme={theme}
                  copiedId={copiedTemplateId}
                  onCopy={copyTemplate}
                />
              ))}
            </>
          )}
        </div>
        </div>
    </div>
  );
}
