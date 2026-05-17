const vscode = require("vscode");
const { setupKaiSwimlaneMd } = require("./render-fences.js");

/** @param {vscode.ExtensionContext} _context */
function activate(_context) {
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
