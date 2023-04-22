import * as assert from "assert";
import * as vscode from "vscode";
import { formatTailwindClasses } from "../../extension";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Iniciando testes.");

  test("Formatação de classes do Tailwind", () => {
    const input = `
      <div twClasses="w-16 h-16 text-white dark:text-black dark:bg-purple-800 bg-slate-200"></div>
      <div twClasses="text-purple-300 w-16 h-16 bg-slate-200"></div>
    `;
    const expectedOutput = `
      <div bg="dark:bg-purple-800 bg-slate-200" font="text-white dark:text-black" size="w-16 h-16"></div>
      <div bg="bg-slate-200" font="text-purple-300" size="w-16 h-16"></div>
    `;
    const textDocument = vscode.workspace.createTextDocument({
      language: "html",
      content: input,
    });
    const edits = formatTailwindClasses(input, textDocument);
    const workspaceEdit = new vscode.WorkspaceEdit();
    for (const edit of edits) {
      workspaceEdit.replace(textDocument.uri, edit.range, edit.newText);
    }
    return vscode.workspace.applyEdit(workspaceEdit).then((success) => {
      assert.strictEqual(
        success,
        true,
        "Falha ao aplicar edições no documento"
      );
      assert.strictEqual(
        textDocument.getText(),
        expectedOutput,
        "Saída incorreta"
      );
    });
  });
});
