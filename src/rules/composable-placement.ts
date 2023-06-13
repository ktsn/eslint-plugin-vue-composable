import { Rule } from 'eslint'
import * as ESTree from 'estree'
import { AST } from 'vue-eslint-parser'

const composableNameRE = /^use[A-Z0-9]/

function hasAttribute(el: AST.VElement, name: string): boolean {
  return el.startTag.attributes.some(
    (attr) => !attr.directive && attr.key.name === name
  )
}

function getScriptSetupElement(context: Rule.RuleContext): AST.VElement | null {
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

function getCalleeName(node: ESTree.Node): string | null {
  if (node.type === 'Identifier') {
    return node.name
  }

  if (node.type === 'MemberExpression') {
    return getCalleeName(node.property)
  }

  return null
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

export default {
  meta: {
    type: 'problem',
  },

  create(context) {
    const scriptSetup = getScriptSetupElement(context)

    function inScriptSetup(node: Rule.Node): boolean {
      if (!scriptSetup || !node.range) {
        return false
      }

      return (
        node.range[0] >= scriptSetup.range[0] &&
        node.range[1] <= scriptSetup.range[1]
      )
    }

    return {
      CallExpression(node) {
        if (getCalleeName(node.callee)?.match(composableNameRE)) {
          const scope = context.sourceCode.getScope(node)
          const block = scope.block as Rule.Node

          const isComposableScope = isComposableFunction(block)
          const isSetupScope = isSetupOption(block)
          const isScriptSetupRoot =
            inScriptSetup(node) && block.type === 'Program'

          if (isComposableScope || isSetupScope || isScriptSetupRoot) {
            return
          }

          context.report({
            node,
            message:
              'Composable function must be placed in the root scope of another composable function.',
          })
        }
      },
    }
  },
} satisfies Rule.RuleModule
