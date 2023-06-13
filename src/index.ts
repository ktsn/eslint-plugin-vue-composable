import { ESLint } from 'eslint'
import composablePlacement from './rules/composable-placement'

const { name, version } = require('../package.json')

const prefix = 'vue-composable'

export = {
  meta: {
    name,
    version,
  },

  rules: {
    'composable-placement': composablePlacement,
  },

  configs: {
    recommended: {
      plugins: [prefix],
      rules: {
        [`${prefix}/composable-placement`]: 'error',
      },
    },
  },
} as ESLint.Plugin
