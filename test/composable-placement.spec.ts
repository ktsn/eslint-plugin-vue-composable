import { RuleTester } from 'eslint'
import rule from '../src/rules/composable-placement'

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
})

describe('vue-composable/composable-placement', () => {
  ruleTester.run('composable-placement', rule, {
    valid: [
      {
        filename: 'in-composable.js',
        code: `
        import { useFoo } from './foo'

        export function useBar() {
          useFoo()
        }
        `,
      },
    ],
    invalid: [
      {
        filename: 'not-in-composable.js',
        code: `
        import { useFoo } from './foo'

        export function bar() {
          useFoo()
        }
        `,
        errors: [{}],
      },
    ],
  })
})
