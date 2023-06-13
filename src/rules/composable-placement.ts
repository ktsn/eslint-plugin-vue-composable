import { Rule } from 'eslint'
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
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name.match(composableNameRE)
        ) {
          const scope = context.sourceCode.getScope(node)
          const block = scope.block as Rule.Node

          const isComposableScope =
            block.type === 'FunctionDeclaration' &&
            block.id?.name.match(composableNameRE)

          const isScriptSetupRoot =
            inScriptSetup(node) && block.type === 'Program'
          if (isComposableScope || isScriptSetupRoot) {
            return
          }

          const isSetupScope =
            (block.type === 'FunctionExpression' ||
              block.type === 'ArrowFunctionExpression') &&
            block.parent.type === 'Property' &&
            block.parent.key.type === 'Identifier' &&
            block.parent.key.name === 'setup' &&
            block.parent.parent.type === 'ObjectExpression'

          if (isSetupScope) {
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
