import { describe, expect, it } from "vitest";
import {
  branchNestLevel,
  findNextSiblingBranchStart,
} from "./branch-rows.js";

describe("branch-rows", () => {
  const twoSequentialIfs = [
    { kind: "branchStart", id: 1, depth: 0, cond: "a" },
    { kind: "branchCase", id: 1, label: "x", depth: 1 },
    { kind: "branchEnd", id: 1, depth: 0 },
    { kind: "branchStart", id: 2, depth: 0, cond: "b" },
    { kind: "branchCase", id: 2, label: "y", depth: 1 },
    { kind: "branchEnd", id: 2, depth: 0 },
  ];

  it("finds next sibling branch after endif even when case depth differs from marker", () => {
    const endIdx = 2;
    const next = findNextSiblingBranchStart(twoSequentialIfs, 0, endIdx);
    expect(next).toBe(3);
    expect(branchNestLevel(twoSequentialIfs, 0)).toBe(0);
    expect(branchNestLevel(twoSequentialIfs, 3)).toBe(0);
  });
});
