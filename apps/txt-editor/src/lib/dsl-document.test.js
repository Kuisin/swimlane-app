import { describe, expect, it } from "vitest";
import { parseDSL } from "@kai-swimlane/core";
import {
  dslContentFromTemplate,
  isBlankTxtContent,
  isDocumentDirty,
  isStaleBlankDiskRead,
  normalizeFileContent,
  normalizeNewTxtRelPath,
  shouldInitializeAsDsl,
  suggestNewTxtFileName,
  syncDocumentFromDisk,
} from "./dsl-document.js";

describe("dsl-document", () => {
  it("detects blank content", () => {
    expect(isBlankTxtContent("")).toBe(true);
    expect(isBlankTxtContent("  \n  ")).toBe(true);
    expect(isBlankTxtContent("@kai-swimlane")).toBe(false);
  });

  it("initializes blank files with valid DSL", () => {
    const normalized = normalizeFileContent("flows/new.txt", "");
    expect(normalized.savedSrc).toBe(normalized.src);
    expect(normalized.needsInitialDiskSave).toBe(true);
    expect(normalized.initializedFromBlank).toBe(true);
    expect(normalized.parseErrorPolicy).toBeNull();
    expect(parseDSL(normalized.src).errors).toHaveLength(0);
    expect(normalized.src).toContain("@kai-swimlane");
    expect(
      isDocumentDirty({
        id: "flows/new.txt",
        src: normalized.src,
        savedSrc: normalized.savedSrc,
        needsInitialDiskSave: true,
      }),
    ).toBe(true);
  });

  it("uses file name in template title", () => {
    const src = dslContentFromTemplate("my-flow.txt");
    expect(src).toMatch(/\/title\/[\s\S]*my-flow/);
  });

  it("suggests unique new file names", () => {
    expect(suggestNewTxtFileName(["新規-1.txt"])).toBe("新規-2.txt");
  });

  it("normalizes new file paths", () => {
    expect(normalizeNewTxtRelPath("foo")).toBe("foo.txt");
    expect(normalizeNewTxtRelPath("../x")).toBeNull();
  });

  it("treats marker-not-found as uninitialized DSL", () => {
    expect(shouldInitializeAsDsl("not dsl")).toBe(true);
    expect(shouldInitializeAsDsl("")).toBe(true);
    const broken = normalizeFileContent("x.txt", "\n");
    expect(broken.initializedFromBlank).toBe(true);
    expect(parseDSL(broken.src).errors).toHaveLength(0);
  });

  it("ignores stale blank disk read when editor already has valid DSL", () => {
    const initialized = normalizeFileContent("flow.txt", "");
    expect(
      isStaleBlankDiskRead("", initialized.src),
    ).toBe(true);
    const synced = syncDocumentFromDisk(
      { id: "flow.txt", ...initialized, revision: 0 },
      "",
      { skipStaleBlank: true },
    );
    expect(synced.savedSrc).toBe(initialized.src);
    expect(synced.src).toBe(initialized.src);
    expect(synced.needsInitialDiskSave).toBe(true);
  });

  it("sync from disk uses raw file bytes as savedSrc", () => {
    const template = dslContentFromTemplate("a.txt");
    const doc = {
      id: "a.txt",
      name: "a",
      src: template,
      savedSrc: template,
      needsInitialDiskSave: false,
      revision: 0,
    };
    const synced = syncDocumentFromDisk(doc, template);
    expect(synced.savedSrc).toBe(template);
    expect(synced.src).toBe(template);
    expect(isDocumentDirty(synced)).toBe(false);
  });

  it("clears dirty after matching save state", () => {
    const template = dslContentFromTemplate("a.txt");
    const saved = {
      id: "a.txt",
      src: template,
      savedSrc: template,
      needsInitialDiskSave: false,
    };
    expect(isDocumentDirty(saved)).toBe(false);
  });
});
