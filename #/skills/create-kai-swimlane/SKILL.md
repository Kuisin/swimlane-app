---
name: create-kai-swimlane
description: Create or edit Kai Swimlane DSL diagrams in kai-swimlane or kai-swimlane-parts fenced blocks. Use when the user asks for swimlane, flow, lane diagrams, or kai-swimlane syntax.
---

# Create Kai Swimlane diagram

## When to use

- User wants a swimlane / lane / process flow diagram
- Editing `kai-swimlane` or `kai-swimlane-parts` markdown fences
- Converting a business process into DSL

## Instructions

1. For a **full diagram**, use a `kai-swimlane` fence with sections `/title/`, `/role/`, `/block/`, `/prop/`, `/line/` (omit `@kai-swimlane` / `@end` unless the user wants explicit markers).
2. Every property line in `/role/`, `/block/`, `/prop/` ends with `;`.
3. Steps in `/line/` use `[roleId: label]`; optional block ref `<blockId>` on the same line.
4. For **style snippets only**, use `kai-swimlane-parts` with `/block/` and/or `/prop/`.
5. Prefer readable role ids (`sales`, `ops`) and reuse `/block/` for warning/success styles.
6. **Markdown preview** needs the bundled VSIX (`npm run install:cursor-plugin` from the repo, or Install from VSIX under `vscode/`). Rules/skills alone do not render diagrams.
7. After editing, remind the user to run **Markdown: Open Preview** when the extension is installed.

## Minimal full example

````markdown
```kai-swimlane
/title/
Order flow
/role/
<sales>
label: Sales;
/line/
[sales: Receive order]
```
````
