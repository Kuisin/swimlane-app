const vscode = require("vscode");
const { setupKaiSwimlaneMd } = require("./render-fences.js");

/** @param {vscode.ExtensionContext} context */
function activate(context) {
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("kaiSwimlane.theme")) {
        vscode.commands.executeCommand("markdown.preview.refresh");
      }
    })
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
