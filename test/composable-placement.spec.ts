import { RuleTester } from 'eslint'
import rule from '../src/rules/composable-placement'

const ruleTester = new RuleTester({
  parser: require.resolve('vue-eslint-parser'),
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

describe('vue-composable/composable-placement', () => {
  ruleTester.run('JS Files', rule, {
    valid: [
      {
        code: `
        import { useFoo } from './foo'

        export function useBar() {
          useFoo()
        }
        `,
      },
      {
        code: `
        import { useFoo } from './foo'

        export const useBar = () => {
          useFoo()
        }
        `,
      },
      {
        code: `
        import { useFoo } from './foo'

        export const useBar = function() {
          useFoo()
        }
        `,
      },
      {
        code: `
        import * as foo from './foo'

        export function useBar() {
          foo.useFoo()
        }
        `,
      },
      {
        code: `
        import { useFoo } from './foo'

        export async function useBar() {
          useFoo()
          await fetch()
        }
        `,
      },
      {
        code: `
        import { useFoo } from './foo'

        export async function useBar() {
          async function baz() {
            await fetch()
          }
          useFoo()
          async function qux() {
            await fetch()
          }
        }
        `,
      },
      {
        code: `
        import { defineComponent } from 'vue'
        import { useFoo } from './foo'

        export default defineComponent({
          setup() {
            useFoo()
          }
        })
        `,
      },
      {
        code: `
        import { defineComponent } from 'vue'
        import { useFoo } from './foo'

        export default defineComponent({
          async setup() {
            useFoo()
            await fetch()
          }
        })
        `,
      },
      {
        code: `
        import { defineComponent } from 'vue'
        import { useFoo } from './foo'

        export default defineComponent({
          async bar() {
            await fetch()
          },
          setup() {
            useFoo()
          },
          async baz() {
            await fetch()
          }
        })
        `,
      },
      {
        code: `
        import { useFoo } from './foo'
        export default {
          setup() {
            useFoo()
          }
        }
        `,
      },
      {
        code: `
        import { useFoo } from './foo'
        export default {
          setup: () => {
            useFoo()
          }
        }
        `,
      },
      {
        code: `
        import Vue from 'vue'
        import { useFoo } from './foo'
        Vue.component('foo', {
          setup() {
            useFoo()
          }
        })
        `,
      },
      {
        code: `
        import { defineStore } from 'pinia'
        import { useAnotherStore } from './another-store'
        const useStore = defineStore('store', {
          actions: {
            foo() {
              useAnotherStore()
            }
          }
        })
        `,
      },
      {
        code: `
        import { defineStore } from 'pinia'
        import { useAnotherStore } from './another-store'
        const useStore = defineStore('store', () => {
          useAnotherStore()
        })
        `,
      },
    ],
    invalid: [
      {
        code: `
        import { useFoo } from './foo'

        export function bar() {
          useFoo()
        }
        `,
        errors: [{ messageId: 'invalidScope' }],
      },
      {
        code: `
        import * as foo from './foo'

        export function bar() {
          foo.useFoo()
        }
        `,
        errors: [{ messageId: 'invalidScope' }],
      },
      {
        code: `
        import { useFoo } from './foo'

        export async function useBar() {
          await fetch()
          useFoo()
        }
        `,
        errors: [{ messageId: 'afterAwait' }],
      },
      {
        code: `
        import { useFoo } from './foo'

        export function useBar() {
          function baz() {
            useFoo()
          }
        }
        `,
        errors: [{ messageId: 'invalidScope' }],
      },
      {
        code: `
        import { defineComponent } from 'vue'
        import { useFoo } from './foo'

        export default defineComponent({
          render() {
            useFoo()
          }
        })
        `,
        errors: [{ messageId: 'invalidScope' }],
      },
      {
        code: `
        import { defineComponent } from 'vue'
        import { useFoo } from './foo'

        export default defineComponent({
          async setup() {
            await fetch()
            useFoo()
          }
        })
        `,
        errors: [{ messageId: 'afterAwait' }],
      },
      {
        code: `
        import { defineStore } from 'pinia'
        import { useAnotherStore } from './another-store'
        const useStore = defineStore('store', {
          actions: {
            foo() {
              function bar() {
                useAnotherStore()
              }
            }
          }
        })
        `,
        errors: [{ messageId: 'invalidScope' }],
      },
      {
        code: `
        import { defineStore } from 'pinia'
        import { useAnotherStore } from './another-store'
        const useStore = defineStore('store', () => {
          function bar() {
            useAnotherStore()
          }
        })
        `,
        errors: [{ messageId: 'invalidScope' }],
      },
    ],
  })

  ruleTester.run('Single File Components', rule, {
    valid: [
      {
        filename: 'in-script-setup.vue',
        code: `
        <script setup>
        import { useFoo } from './foo'
        useFoo()
        </script>
        `,
      },
      {
        filename: 'after-await.vue',
        code: `
        <script setup>
        import { useFoo } from './foo'
        await fetch()
        useFoo()
        </script>
        `,
      },
    ],
    invalid: [
      {
        filename: 'not-in-root-script-setup.vue',
        code: `
        <script setup>
        import { useFoo } from './foo'

        function bar() {
          useFoo()
        }
        </script>
        `,
        errors: [{ messageId: 'invalidScope' }],
      },
      {
        filename: 'not-in-script-setup.vue',
        code: `
        <script>
        import { useFoo } from './foo'
        useFoo()
        </script>
        </script setup>
        const bar = 1
        </script>
        `,
        errors: [{ messageId: 'invalidScope' }],
      },
      {
        filename: 'after-await-in-composable.vue',
        code: `
        <script setup>
        import { useFoo } from './foo'
        async function useBar() {
          await fetch()
          useFoo()
        }
        </script>
        `,
        errors: [{ messageId: 'afterAwait' }],
      },
    ],
  })
})
