const vscode = require("vscode");
const { setupKaiSwimlaneMd } = require("./render-fences.js");
const { embedDiagramsForExport } = require("./embed-export.js");
const {
  setupMarkdownPreviewEnhanced,
  syncMpeParserTheme,
} = require("./mpe-integration.js");

/** @param {vscode.ExtensionContext} context */
function activate(context) {
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("kaiSwimlane.theme")) {
        vscode.commands.executeCommand("markdown.preview.refresh");
        syncMpeParserTheme(context);
      }
    }),
    vscode.commands.registerCommand(
      "kaiSwimlane.setupMarkdownPreviewEnhanced",
      () => setupMarkdownPreviewEnhanced(context)
    ),
    vscode.commands.registerCommand(
      "kaiSwimlane.embedDiagramsForExport",
      embedDiagramsForExport
    )
  );

  return {
    extendMarkdownIt(md) {
      return setupKaiSwimlaneMd(md, () =>
        vscode.workspace
          .getConfiguration("kaiSwimlane")
          .get("theme", "basic")
      );
    },
  };
}

function deactivate() {}

module.exports = { activate, deactivate };
