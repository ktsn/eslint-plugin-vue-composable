import { Rule } from 'eslint'
import * as assert from 'assert'
import {
  getCalleeName,
  getParentContext,
  getScriptSetupElement,
  isComposableFunction,
  isSetupOption,
} from './composable-placement'

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

    function inScriptSetup(node: Rule.Node): boolean {
      if (!scriptSetup || !node.range) {
        return false
      }

      return (
        node.range[0] >= scriptSetup.range[0] &&
        node.range[1] <= scriptSetup.range[1]
      )
    }

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

        const ctx = getParentContext(node)

        const isComposableScope = isComposableFunction(ctx)
        const isSetupScope = isSetupOption(ctx)
        const isScriptSetupRoot = inScriptSetup(node) && ctx.type === 'Program'

        if (!isComposableScope && !isSetupScope && !isScriptSetupRoot) {
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
