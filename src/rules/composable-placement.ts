import { Rule } from 'eslint'
import * as assert from 'assert'
import {
  composableNameRE,
  getCalleeName,
  getScriptSetupElement,
  isComposableRoot,
} from '../utils'

function inPiniaStoreArg(node: Rule.Node | null): boolean {
  if (!node) {
    return false
  }

  if (
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'ArrowFunctionExpression'
  ) {
    return false
  }

  if (node.type !== 'CallExpression') {
    return inPiniaStoreArg(node.parent)
  }

  return getCalleeName(node) === 'defineStore'
}

function inPiniaStoreRootScope(node: Rule.Node | null): boolean {
  if (!node) {
    return false
  }

  if (
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'ArrowFunctionExpression'
  ) {
    return inPiniaStoreArg(node.parent)
  }

  return inPiniaStoreRootScope(node.parent)
}

export default {
  meta: {
    type: 'problem',
    messages: {
      invalidContext:
        '`{{ name }}` is likely a composable and should be called in root context of setup() or another composable.',
      afterAwait:
        '`{{ name }}` is likely a composable and is forbidden after an `await` expression.',
    },
  },

  create(context) {
    const scriptSetup = getScriptSetupElement(context)
    const functionStack: { node: Rule.Node; firstAwait: Rule.Node | null }[] =
      []

    return {
      ':function'(node: Rule.Node) {
        functionStack.push({
          node,
          firstAwait: null,
        })
      },

      ':function:exit'(node: Rule.Node) {
        const last = functionStack[functionStack.length - 1]
        assert(last?.node === node)
        functionStack.pop()
      },

      AwaitExpression(node) {
        if (functionStack.length > 0) {
          const current = functionStack[functionStack.length - 1]!
          if (!current.firstAwait) {
            current.firstAwait = node
          }
        }
      },

      CallExpression(node) {
        const name = getCalleeName(node.callee)
        if (!name?.match(composableNameRE)) {
          return
        }

        const { firstAwait } = functionStack[functionStack.length - 1] ?? {
          firstAwait: null,
        }

        // Forbidden composable after await but allow if the first await is for this CallExpression.
        if (firstAwait && firstAwait !== node.parent) {
          context.report({
            node,
            messageId: 'afterAwait',
            data: {
              name,
            },
          })
        }

        if (
          !isComposableRoot(node, scriptSetup) &&
          !inPiniaStoreRootScope(node)
        ) {
          context.report({
            node,
            messageId: 'invalidContext',
            data: {
              name,
            },
          })
        }
      },
    }
  },
} satisfies Rule.RuleModule
