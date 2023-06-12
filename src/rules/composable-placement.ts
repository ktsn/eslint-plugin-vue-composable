import { Rule } from 'eslint'

const composableNameRE = /^use[A-Z0-9]/

export default {
  meta: {
    type: 'problem',
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name.match(composableNameRE)
        ) {
          const scope = context.sourceCode.getScope(node)
          if (
            scope.block.type === 'FunctionDeclaration' &&
            scope.block.id?.name.match(composableNameRE)
          ) {
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
