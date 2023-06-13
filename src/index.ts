import composablePlacement from './rules/composable-placement'

const { name, version } = require('../package.json')

export = {
  meta: {
    name,
    version,
  },

  rules: {
    'composable-placement': composablePlacement,
  },
}
