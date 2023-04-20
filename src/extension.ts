// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

function processTailwindClasses(text) {
  // Procure por componentes com o atributo isComposeUI
  const composeUIComponentRegex = /<[A-Za-z]+\s+[^>]*isComposeUI[^>]*>/g;

  let newText = text;
  let match;

  while ((match = composeUIComponentRegex.exec(text)) !== null) {
    const componentString = match[0];

    // Procure pelas classes Tailwind no atributo className
    const classNameRegex = /className="([^"]*)"/;
    const classNameMatch = componentString.match(classNameRegex);

    if (classNameMatch) {
      const classNames = classNameMatch[1];

      // Divida as classes e reorganize-as conforme necessário
      // (adapte a lógica de reorganização às suas necessidades específicas)
      const organizedClassNames = reorganizeClassNames(classNames);

      // Substitua o atributo className pelas classes reorganizadas
      const newComponentString = componentString.replace(
        classNameMatch[0],
        `size="${organizedClassNames.size}" bg="${organizedClassNames.bg}"`
      );

      newText = newText.replace(componentString, newComponentString);
    }
  }

  return newText;
}

function reorganizeClassNames(classNames) {
  const sizeRegex = /(w-[0-9]+(?:\.[0-9]+)?\s+h-[0-9]+(?:\.[0-9]+)?)/;
  const bgRegex = /(bg-[\w-]+(?:\s+dark:bg-[\w-]+)?)/;

  const sizeMatch = classNames.match(sizeRegex);
  const bgMatch = classNames.match(bgRegex);

  return {
    size: sizeMatch ? sizeMatch[1] : "",
    bg: bgMatch ? bgMatch[1] : "",
  };
}

const example = () => {
  const document = vscode.window;
  //const text = document.getText();
  console.log(document.activeTextEditor.document.getText());
};

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "compose-ui-helper" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "compose-ui-helper.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage(
        "Hello World from Compose UI Helper!"
      );
    }
  );

  context.subscriptions.push(disposable);

  context.subscriptions.push(
    vscode.commands.registerCommand("extension.organizeTailwindClasses", () => {
      // Implemente a lógica para chamar a função processTailwindClasses aqui
      example();
    })
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
