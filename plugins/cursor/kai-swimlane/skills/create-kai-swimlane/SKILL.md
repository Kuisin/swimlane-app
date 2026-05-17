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

1. For a **full diagram**, wrap content in a `kai-swimlane` fence and include `@kai-swimlane` … `@end`.
2. Use sections in order as needed: `/title/`, `/role/`, `/block/`, `/prop/`, `/line/`.
3. Every property line in `/role/`, `/block/`, `/prop/` ends with `;`.
4. Steps in `/line/` use `[roleId: label]`; optional block ref `<blockId>` on the same line.
5. For **style snippets only**, use `kai-swimlane-parts` with `/block/` and/or `/prop/` (no `@kai-swimlane` wrapper).
6. Prefer readable role ids (`sales`, `ops`) and reuse `/block/` for warning/success styles.
7. After editing, remind the user to open **Markdown preview** if the VS Code extension is installed.

## Minimal full example

````markdown
```kai-swimlane
@kai-swimlane
/title/
Order flow
/role/
<sales>
label: Sales;
/line/
[sales: Receive order]
@end
```
````
