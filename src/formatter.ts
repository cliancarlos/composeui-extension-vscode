import acorn = require("acorn");
import jsx = require("acorn-jsx");
import * as vscode from "vscode";

import * as babelTraverse from "@babel/traverse";
import type { Node as EstreeNode } from "estree";
import * as babelParser from "@babel/parser";

interface JSXAttribute {
  name: {
    name: string;
  };
  value: {
    value: string;
  };
}

type TailwindClassMap = {
  [key: string]: string[];
};

interface TextEdit {
  range: vscode.Range;
  newText: string;
}

export function formatTailwindClasses(
  code: string,
  document: vscode.TextDocument
): TextEdit[] {
  const jsxParser = acorn.Parser.extend(jsx());

  const tailwindClassMap: TailwindClassMap = {
    size: ["w-", "h-"],
    bg: ["bg-", "dark:bg-"],
    font: ["text-", "dark:text-"],
  };

  function findMatchingProp(classname: string): string | null {
    for (const [prop, prefixes] of Object.entries(tailwindClassMap)) {
      for (const prefix of prefixes) {
        if (classname.startsWith(prefix)) {
          return prop;
        }
      }
    }
    return null;
  }

  function processTailwindClasses(twClasses: string): TailwindClassMap {
    const classList = twClasses.split(" ");
    const propClassMap: TailwindClassMap = {};

    for (const classname of classList) {
      const prop = findMatchingProp(classname);

      if (prop) {
        if (!propClassMap[prop]) {
          propClassMap[prop] = [];
        }
        propClassMap[prop].push(classname);
      }
    }

    return propClassMap;
  }

  function mergePropClassMaps(
    original: TailwindClassMap,
    additions: TailwindClassMap
  ): TailwindClassMap {
    const merged: TailwindClassMap = { ...original };

    for (const [prop, classes] of Object.entries(additions)) {
      if (merged[prop]) {
        merged[prop] = Array.from(new Set([...merged[prop], ...classes]));
      } else {
        merged[prop] = classes;
      }
    }

    return merged;
  }

  function transformJSXElement(node: EstreeNode) {
    const openingElement = (node as any).openingElement;

    if (!openingElement) {
      return null;
    }

    const twClassesAttribute = (openingElement.attributes as any[]).find(
      (attribute) => attribute.name && attribute.name.name === "twClasses"
    );

    if (!twClassesAttribute) {
      return null;
    }

    const twClasses = twClassesAttribute.value.value;
    const propClassMap = processTailwindClasses(twClasses);

    const transformations = [];

    // Remove the twClasses attribute
    transformations.push({
      start: twClassesAttribute.start,
      end: twClassesAttribute.end,
      text: "",
    });

    // Merge with existing props, if any
    const existingPropAttributes = (openingElement.attributes as any[]).filter(
      (attribute) =>
        (attribute.name &&
          attribute.name.name !== "twClasses" &&
          attribute.name.name.startsWith("bg")) ||
        attribute.name.name.startsWith("font") ||
        attribute.name.name.startsWith("size")
    );

    let existingPropClassMap: TailwindClassMap = {};

    for (const propAttribute of existingPropAttributes) {
      const prop = propAttribute.name.name;
      const classes = propAttribute.value.value.split(" ");
      existingPropClassMap[prop] = classes;
    }

    const mergedPropClassMap = mergePropClassMaps(
      existingPropClassMap,
      propClassMap
    );

    // Generate new prop attributes
    for (const [prop, classes] of Object.entries(mergedPropClassMap)) {
      const propClasses = classes.join(" ");
      const existingAttributeIndex = existingPropAttributes.findIndex(
        (attr) => attr.name.name === prop
      );
      if (existingAttributeIndex !== -1) {
        // Add new classes to existing prop
        const existingAttribute =
          existingPropAttributes[existingAttributeIndex];
        const existingClassList =
          existingAttribute.value?.value.split(" ") ?? [];
        const newClassList = Array.from(
          new Set([...existingClassList, ...classes])
        );
        transformations.push({
          start: existingAttribute.value.start,
          end: existingAttribute.value.end,
          text: `"${newClassList.join(" ")}"`,
        });
      } else {
        // Add new prop with classes
        const newText = ` ${prop}="${propClasses}" `;
        transformations.push({
          start: openingElement.name.end,
          end: openingElement.name.end,
          text: newText,
        });
      }
    }

    return transformations.sort((a, b) => b.start - a.start);
  }

  let ast;

  try {
    ast = babelParser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
      allowImportExportEverywhere: true,
    });
  } catch (error) {
    console.error("Erro ao gerar AST:", error);
    // Se você deseja retornar o código original em caso de erro, descomente a linha abaixo
    return [];
  }

  const jsxElements: EstreeNode[] = [];

  try {
    babelTraverse.default(ast, {
      enter(path) {
        if (path.isJSXElement()) {
          jsxElements.push(path.node);
        }
      },
    });
  } catch (error) {
    console.error("Erro ao caminhar pelo AST:", error);
    // Se você deseja retornar o código original em caso de erro, descomente a linha abaixo
    // return [];
  }

  const allTransformations = jsxElements
    .map(transformJSXElement)
    .flat()
    .filter((transformation) => transformation !== null);

  return allTransformations;
}
