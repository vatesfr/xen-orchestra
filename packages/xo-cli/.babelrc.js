'use strict'

const NODE_ENV = process.env.NODE_ENV || 'development'
const __PROD__ = NODE_ENV === 'production'
const __TEST__ = NODE_ENV === 'test'

const pkg = require('./package')

const plugins = {
  lodash: {},
}

const presets = {
  '@babel/preset-env': {
    debug: !__TEST__,
    loose: true,
    shippedProposals: true,
    targets: __PROD__
      ? (() => {
        let node = (pkg.engines || {}).node
        if (node !== undefined) {
          const trimChars = '^=>~'
          while (trimChars.includes(node[0])) {
            node = node.slice(1)
          }
          return { node: node }
        }
      })()
      : { browsers: '', node: 'current' },
    useBuiltIns: '@babel/polyfill' in (pkg.dependencies || {}) && 'usage',
  },
}

Object.keys(pkg.devDependencies || {}).forEach(name => {
  if (!(name in presets) && /@babel\/plugin-.+/.test(name)) {
    plugins[name] = {}
  } else if (!(name in presets) && /@babel\/preset-.+/.test(name)) {
    presets[name] = {}
  }
})

module.exports = {
  comments: !__PROD__,
  ignore: __TEST__ ? undefined : [/\.spec\.js$/],
  plugins: Object.keys(plugins).map(plugin => [plugin, plugins[plugin]]),
  presets: Object.keys(presets).map(preset => [preset, presets[preset]]),
}
