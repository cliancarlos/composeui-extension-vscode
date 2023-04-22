import * as vscode from "vscode";
import { formatTailwindClasses } from "./formatter";

async function applyChanges(
  document: vscode.TextDocument,
  edits: TextEdit[]
): Promise<void> {
  const editor = await vscode.window.showTextDocument(document);
  const totalRange = new vscode.Range(
    document.positionAt(0),
    document.positionAt(document.getText().length)
  );

  // Create new text by applying all edits
  const newText = edits.reduce((text, edit) => {
    console.dir(edit);
    const editRange = new vscode.Range(
      document.positionAt(edit.start),
      document.positionAt(edit.end)
    );
    return text.slice(0, edit.start) + edit.text + text.slice(edit.end);
  }, document.getText());

  // Replace entire text with new text
  editor.edit((edit) => {
    edit.replace(totalRange, newText);
  });
}

function registerOnSaveHandler(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.workspace.onWillSaveTextDocument(async (e) => {
      console.log("Clicou em salvar");
      const document = e.document;
      const languageId = document.languageId;

      // Verifique se o arquivo é JavaScript, TypeScript, ou TypeScript React antes de aplicar a formatação
      if (
        languageId === "javascript" ||
        languageId === "typescript" ||
        languageId === "typescriptreact"
      ) {
        const edits = formatTailwindClasses(document.getText(), document);

        if (edits.length > 0) {
          console.log("vai aplicar changes");
          e.waitUntil(applyChanges(document, edits));
        }
      }
    })
  );
}

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "compose-ui-helper" is now active!'
  );

  registerOnSaveHandler(context);

  let disposable = vscode.commands.registerCommand(
    "compose-ui-helper.helloWorld",
    () => {
      vscode.window.showInformationMessage(
        "Hello World from Compose UI Helper!"
      );
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
