import { ESLint } from 'eslint'
import composablePlacement from './rules/composable-placement'
import lifecyclePlacement from './rules/lifecycle-placement'

const { name, version } = require('../package.json')

const prefix = 'vue-composable'

export = {
  meta: {
    name,
    version,
  },

  rules: {
    'composable-placement': composablePlacement,
    'lifecycle-placement': lifecyclePlacement,
  },

  configs: {
    recommended: {
      plugins: [prefix],
      rules: {
        [`${prefix}/composable-placement`]: 'error',
        [`${prefix}/lifecycle-placement`]: 'error',
      },
    },
  },
} as ESLint.Plugin
