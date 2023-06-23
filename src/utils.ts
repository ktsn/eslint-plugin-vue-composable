import { Rule } from 'eslint'
import * as ESTree from 'estree'
import { AST } from 'vue-eslint-parser'

export const composableNameRE = /^use[A-Z0-9]/

export function getCalleeName(node: ESTree.Node): string | null {
  if (node.type === 'Identifier') {
    return node.name
  }

  if (node.type === 'CallExpression') {
    return getCalleeName(node.callee)
  }

  if (node.type === 'MemberExpression') {
    return getCalleeName(node.property)
  }

  return null
}

function getParentContext(node: Rule.Node): Rule.Node {
  if (
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'ArrowFunctionExpression'
  ) {
    return node
  }

  return node.parent ? getParentContext(node.parent) : node
}

function isComposableFunction(node: Rule.Node): boolean {
  if (node.type === 'FunctionDeclaration') {
    return composableNameRE.test(node.id?.name ?? '')
  }

  if (
    node.type === 'FunctionExpression' ||
    node.type === 'ArrowFunctionExpression'
  ) {
    return (
      node.parent.type === 'VariableDeclarator' &&
      node.parent.id.type === 'Identifier' &&
      composableNameRE.test(node.parent.id.name)
    )
  }

  return false
}

function isSetupOption(node: Rule.Node): boolean {
  return (
    (node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression') &&
    node.parent.type === 'Property' &&
    node.parent.key.type === 'Identifier' &&
    node.parent.key.name === 'setup' &&
    node.parent.parent.type === 'ObjectExpression'
  )
}

function hasAttribute(el: AST.VElement, name: string): boolean {
  return el.startTag.attributes.some(
    (attr) => !attr.directive && attr.key.name === name
  )
}

export function getScriptSetupElement(
  context: Rule.RuleContext
): AST.VElement | null {
  const df =
    context.parserServices.getDocumentFragment &&
    context.parserServices.getDocumentFragment()
  if (!df) {
    return null
  }

  const scripts: AST.VElement[] = df.children.filter(
    (e: AST.Node) => e.type === 'VElement' && e.name === 'script'
  )

  return scripts.find((e) => hasAttribute(e, 'setup')) ?? null
}

export function isComposableRoot(
  node: Rule.Node,
  scriptSetupElement: AST.VElement | null
): boolean {
  function inScriptSetup(node: Rule.Node): boolean {
    if (!scriptSetupElement || !node.range) {
      return false
    }

    return (
      node.range[0] >= scriptSetupElement.range[0] &&
      node.range[1] <= scriptSetupElement.range[1]
    )
  }

  const ctx = getParentContext(node)

  const isComposableScope = isComposableFunction(ctx)
  const isSetupScope = isSetupOption(ctx)
  const isScriptSetupRoot = inScriptSetup(node) && ctx.type === 'Program'

  return isComposableScope || isSetupScope || isScriptSetupRoot
}
