import { Rule } from 'eslint'
import * as assert from 'assert'
import {
  getCalleeName,
  getScriptSetupElement,
  isComposableRoot,
} from '../utils'

const lifecycleHooks = [
  // Core
  'onMounted',
  'onUpdated',
  'onUnmounted',
  'onBeforeMount',
  'onBeforeUpdate',
  'onBeforeUnmount',
  'onErrorCaptured',
  'onRenderTracked',
  'onRenderTriggered',
  'onActivated',
  'onDeactivated',
  'onServerPrefetch',

  // Vue Router
  'onBeforeRouteLeave',
  'onBeforeRouteUpdate',
]

export default {
  meta: {
    type: 'problem',
    messages: {
      invalidContext:
        'Lifecycle hook `{{ name }}` should be called in root context of setup() or another composable.',
      afterAwait:
        'Lifecycle hook `{{ name }}` is forbidden after an `await` expression.',
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
        if (!name || !lifecycleHooks.includes(name)) {
          return
        }

        const { firstAwait } = functionStack[functionStack.length - 1] ?? {
          firstAwait: null,
        }

        // Forbidden lifecycle hook after await
        if (firstAwait && firstAwait !== node.parent) {
          context.report({
            node,
            messageId: 'afterAwait',
            data: {
              name,
            },
          })
        }

        if (!isComposableRoot(node, scriptSetup)) {
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
} as Rule.RuleModule
