import { RuleTester } from 'eslint'
import rule from '../src/rules/lifecycle-placement'

const ruleTester = new RuleTester({
  parser: require.resolve('vue-eslint-parser'),
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

describe('vue-composable/lifecycle-placement', () => {
  ruleTester.run('JS Files', rule, {
    valid: [
      {
        code: `
        export function useBar() {
          onMounted(() => {})
        }
        `,
      },
      {
        code: `
        export const useBar = () => {
          onMounted(() => {})
        }
        `,
      },
      {
        code: `
        export const useBar = function() {
          onMounted(() => {})
        }
        `,
      },
      {
        code: `
        import * as vue from 'vue'
        export function useBar() {
          vue.onMounted(() => {})
        }
        `,
      },
      {
        code: `
        export function useBar() {
          if (bar) {
            onMounted(() => {})
          }
        }
        `,
      },
      {
        code: `
        export async function useBar() {
          onMounted(() => {})
          await fetch()
        }
        `,
      },
      {
        code: `
        export async function useBar() {
          async function baz() {
            await fetch()
          }
          onMounted(() => {})
          async function qux() {
            await fetch()
          }
        }
        `,
      },
      {
        code: `
        import { defineComponent } from 'vue'
        export default defineComponent({
          setup() {
            onMounted(() => {})
          }
        })
        `,
      },
      {
        code: `
        import { defineComponent } from 'vue'
        export default defineComponent({
          async setup() {
            onMounted(() => {})
            await fetch()
          }
        })
        `,
      },
      {
        code: `
        import { defineComponent } from 'vue'
        export default defineComponent({
          async bar() {
            await fetch()
          },
          setup() {
            onMounted(() => {})
          },
          async baz() {
            await fetch()
          }
        })
        `,
      },
      {
        code: `
        export default {
          setup() {
            onMounted(() => {})
          }
        }
        `,
      },
      {
        code: `
        export default {
          setup: () => {
            onMounted(() => {})
          }
        }
        `,
      },
      {
        code: `
        import Vue from 'vue'
        Vue.component('foo', {
          setup() {
            onMounted(() => {})
          }
        })
        `,
      },
    ],
    invalid: [
      {
        code: `
        export function bar() {
          onMounted(() => {})
        }
        `,
        errors: [
          {
            messageId: 'invalidContext',
            data: { name: 'onMounted' },
          },
        ],
      },
      {
        code: `
        import * as vue from 'vue'

        export function bar() {
          vue.onMounted(() => {})
        }
        `,
        errors: [
          {
            messageId: 'invalidContext',
            data: { name: 'onMounted' },
          },
        ],
      },
      {
        code: `
        export function useBar() {
          if (bar) {
            function baz() {
              onMounted(() => {})
            }
          }
        }
        `,
        errors: [
          {
            messageId: 'invalidContext',
            data: {
              name: 'onMounted',
            },
          },
        ],
      },
      {
        code: `
        export async function useBar() {
          await fetch()
          onMounted(() => {})
        }
        `,
        errors: [
          {
            messageId: 'afterAwait',
            data: {
              name: 'onMounted',
            },
          },
        ],
      },
      {
        code: `
        export function useBar() {
          function baz() {
            onMounted(() => {})
          }
        }
        `,
        errors: [
          {
            messageId: 'invalidContext',
            data: {
              name: 'onMounted',
            },
          },
        ],
      },
      {
        code: `
        import { defineComponent } from 'vue'
        export default defineComponent({
          render() {
            onMounted(() => {})
          }
        })
        `,
        errors: [
          {
            messageId: 'invalidContext',
            data: {
              name: 'onMounted',
            },
          },
        ],
      },
      {
        code: `
        import { defineComponent } from 'vue'
        export default defineComponent({
          async setup() {
            await fetch()
            onMounted()
          }
        })
        `,
        errors: [
          {
            messageId: 'afterAwait',
            data: {
              name: 'onMounted',
            },
          },
        ],
      },
    ],
  })

  ruleTester.run('Single File Components', rule, {
    valid: [
      {
        filename: 'in-script-setup.vue',
        code: `
        <script setup>
        onMounted(() => {})
        </script>
        `,
      },
      {
        filename: 'after-await.vue',
        code: `
        <script setup>
        await fetch()
        onMounted(() => {})
        </script>
        `,
      },
    ],
    invalid: [
      {
        filename: 'not-in-root-script-setup.vue',
        code: `
        <script setup>
        function bar() {
          onMounted(() => {})
        }
        </script>
        `,
        errors: [
          {
            messageId: 'invalidContext',
            data: {
              name: 'onMounted',
            },
          },
        ],
      },
      {
        filename: 'not-in-script-setup.vue',
        code: `
        <script>
        onMounted(() => {})
        </script>
        </script setup>
        const bar = 1
        </script>
        `,
        errors: [
          {
            messageId: 'invalidContext',
            data: {
              name: 'onMounted',
            },
          },
        ],
      },
      {
        filename: 'after-await-in-composable.vue',
        code: `
        <script setup>
        async function useBar() {
          await fetch()
          onMounted(() => {})
        }
        </script>
        `,
        errors: [
          {
            messageId: 'afterAwait',
            data: {
              name: 'onMounted',
            },
          },
        ],
      },
    ],
  })
})
