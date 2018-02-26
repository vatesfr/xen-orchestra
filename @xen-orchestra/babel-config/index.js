'use strict'

const PLUGINS_RE = /^(?:@babel\/plugin-.+|babel-plugin-lodash)$/
const PRESETS_RE = /^@babel\/preset-.+$/

const NODE_ENV = process.env.NODE_ENV || 'development'
const __PROD__ = NODE_ENV === 'production'
const __TEST__ = NODE_ENV === 'test'

module.exports = function (pkg, plugins, presets) {
  plugins === undefined && (plugins = {})

  presets === undefined && (presets = {})
  presets['@babel/preset-env'] = {
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
  }

  Object.keys(pkg.devDependencies || {}).forEach(name => {
    if (!(name in presets) && PLUGINS_RE.test(name)) {
      plugins[name] = {}
    } else if (!(name in presets) && PRESETS_RE.test(name)) {
      presets[name] = {}
    }
  })

  return {
    comments: !__PROD__,
    ignore: __TEST__ ? undefined : [/\.spec\.js$/],
    plugins: Object.keys(plugins).map(plugin => [plugin, plugins[plugin]]),
    presets: Object.keys(presets).map(preset => [preset, presets[preset]]),
  }
}
