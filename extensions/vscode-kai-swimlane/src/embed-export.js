const vscode = require("vscode");
const { expandFencesInMarkdown } = require("./expand-fences.js");

function getThemeKey() {
  return vscode.workspace.getConfiguration("kaiSwimlane").get("theme", "basic");
}

async function embedDiagramsForExport() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    await vscode.window.showWarningMessage(
      "Open a Markdown file to embed Kai Swimlane diagrams for export."
    );
    return;
  }

  if (editor.document.languageId !== "markdown") {
    await vscode.window.showWarningMessage(
      "The active file is not Markdown."
    );
    return;
  }

  const source = editor.document.getText();
  if (!/```kai-swimlane/.test(source)) {
    await vscode.window.showInformationMessage(
      "No kai-swimlane or kai-swimlane-parts fences found in this file."
    );
    return;
  }

  const expanded = expandFencesInMarkdown(source, { theme: getThemeKey() });
  const baseName = editor.document.fileName.replace(/\.md$/i, "");
  const targetUri = vscode.Uri.file(`${baseName}.kai-export.md`);

  const edit = new vscode.WorkspaceEdit();
  edit.createFile(targetUri, { overwrite: true, ignoreIfExists: false });
  edit.insert(targetUri, new vscode.Position(0, 0), expanded);
  await vscode.workspace.applyEdit(edit);

  const doc = await vscode.workspace.openTextDocument(targetUri);
  await vscode.window.showTextDocument(doc, { preview: false });
  await vscode.window.showInformationMessage(
    `Created ${targetUri.fsPath} with diagrams embedded as HTML. Use this file with Markdown PDF or similar exporters.`
  );
}

module.exports = { embedDiagramsForExport };
