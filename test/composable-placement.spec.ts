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
    ],
    invalid: [
      {
        code: `
        import { useFoo } from './foo'

        export function bar() {
          useFoo()
        }
        `,
        errors: [{}],
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
        errors: [{}],
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
        errors: [{}],
      },
    ],
  })

  ruleTester.run('Single File Components', rule, {
    valid: [
      {
        filename: 'in-composable.vue',
        code: `
        <script>
        import { useFoo } from './foo'

        function useBar() {
          useFoo()
        }
        </script>
        `,
      },
      {
        filename: 'in-setup.vue',
        code: `
        <script>
        import { defineComponent } from 'vue'
        import { useFoo } from './foo'

        export default defineComponent({
          setup() {
            useFoo()
          }
        })
        </script>
        `,
      },
      {
        filename: 'in-script-setup.vue',
        code: `
        <script setup>
        import { useFoo } from './foo'
        useFoo()
        </script>
        `,
      },
    ],
    invalid: [
      {
        filename: 'not-in-composable.vue',
        code: `
        <script>
        import { useFoo } from './foo'

        function bar() {
          useFoo()
        }
        </script>
        `,
        errors: [{}],
      },
      {
        filename: 'not-directly-in-composable.vue',
        code: `
        <script>
        import { useFoo } from './foo'

        export function useBar() {
          function baz() {
            useFoo()
          }
        }
        </script>
        `,
        errors: [{}],
      },
      {
        filename: 'not-in-setup.vue',
        code: `
        <script>
        import { defineComponent } from 'vue'
        import { useFoo } from './foo'

        export default defineComponent({
          render() {
            useFoo()
          }
        })
        </script>
        `,
        errors: [{}],
      },
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
        errors: [{}],
      },
    ],
  })
})
