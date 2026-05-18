# Kai Swimlane — Cursor local plugin

Cursor plugin (rules + skill) plus optional **VS Code / Cursor Markdown preview** extension (`.vsix`).

## Install into Cursor (local)

Copy this entire folder to your Cursor local plugins directory (real copy, not a symlink):

```text
~/.cursor/plugins/local/kai-swimlane/
```

From the repository root:

```bash
npm run install:cursor-plugin
```

Or manually:

```bash
mkdir -p ~/.cursor/plugins/local
rm -rf ~/.cursor/plugins/local/kai-swimlane
cp -R plugins/cursor/kai-swimlane ~/.cursor/plugins/local/kai-swimlane
```

Then **restart Cursor** or run **Developer: Reload Window**.

## Markdown diagram preview (VSIX)

The plugin folder may include a bundled extension under `vscode/`:

```text
vscode/vscode-kai-swimlane-<version>.vsix
```

After copying the plugin, install the VSIX:

```bash
cursor --install-extension ~/.cursor/plugins/local/kai-swimlane/vscode/vscode-kai-swimlane-0.1.4.vsix
```

Or use **Extensions → ⋯ → Install from VSIX…**.

Download the latest VSIX from [GitHub Releases](https://github.com/YOUR_ORG/kai-swimlane/releases) if `vscode/` is empty in your copy.

## What this plugin provides

| Component | Purpose |
|-----------|---------|
| `rules/kai-swimlane-dsl.mdc` | DSL syntax guidance in Agent |
| `skills/create-kai-swimlane/` | Skill to author diagrams |
| `commands/open-preview-test.md` | How to verify preview |
| `vscode/*.vsix` | Optional bundled Markdown preview extension |

Diagrams render in the **built-in Markdown preview** when the VSIX is installed. Open a `.md` file and run **Markdown: Open Preview**.

See [docs/PLUGIN.md](../../../docs/PLUGIN.md) in the repo for details.

## Update

Re-run `npm run install:cursor-plugin` after pulling changes, or copy the folder again.
