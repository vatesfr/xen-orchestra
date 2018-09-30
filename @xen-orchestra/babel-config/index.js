'use strict'

const PLUGINS_RE = /^(?:@babel\/|babel-)plugin-.+$/
const PRESETS_RE = /^@babel\/preset-.+$/

const NODE_ENV = process.env.NODE_ENV || 'development'
const __PROD__ = NODE_ENV === 'production'
const __TEST__ = NODE_ENV === 'test'

const configs = {
  '@babel/plugin-proposal-decorators': {
    legacy: true,
  },
  '@babel/plugin-proposal-pipeline-operator': {
    proposal: 'minimal',
  },
  '@babel/preset-env' (pkg) {
    return {
      debug: !__TEST__,

      // disabled until https://github.com/babel/babel/issues/8323 is resolved
      // loose: true,

      shippedProposals: true,
      targets: (() => {
        let node = (pkg.engines || {}).node
        if (node !== undefined) {
          const trimChars = '^=>~'
          while (trimChars.includes(node[0])) {
            node = node.slice(1)
          }
        }
        return { browsers: pkg.browserslist, node }
      })(),
      useBuiltIns: '@babel/polyfill' in (pkg.dependencies || {}) && 'usage',
    }
  },
}

const getConfig = (key, ...args) => {
  const config = configs[key]
  return config === undefined
    ? {}
    : typeof config === 'function'
      ? config(...args)
      : config
}

module.exports = function (pkg, plugins, presets) {
  plugins === undefined && (plugins = {})
  presets === undefined && (presets = {})

  Object.keys(pkg.devDependencies || {}).forEach(name => {
    if (!(name in presets) && PLUGINS_RE.test(name)) {
      plugins[name] = getConfig(name, pkg)
    } else if (!(name in presets) && PRESETS_RE.test(name)) {
      presets[name] = getConfig(name, pkg)
    }
  })

  return {
    comments: !__PROD__,
    ignore: __TEST__ ? undefined : [/\.spec\.js$/],
    plugins: Object.keys(plugins).map(plugin => [plugin, plugins[plugin]]),
    presets: Object.keys(presets).map(preset => [preset, presets[preset]]),
  }
}
