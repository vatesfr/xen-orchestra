'use strict'

const NODE_ENV = process.env.NODE_ENV || 'development'
const __PROD__ = NODE_ENV === 'production'
const __TEST__ = NODE_ENV === 'test'

const pkg = require('./package')

let nodeCompat = (pkg.engines || {}).node
if (nodeCompat === undefined) {
  nodeCompat = '6'
} else {
  const trimChars = '^=>~'
  while (trimChars.includes(nodeCompat[0])) {
    nodeCompat = nodeCompat.slice(1)
  }
}

module.exports = {
  comments: !__PROD__,
  ignore: __TEST__ ? undefined : [/\.spec\.js$/],
  plugins: ['lodash'],
  presets: [
    [
      '@babel/env',
      {
        debug: !__TEST__,
        loose: true,
        shippedProposals: true,
        targets: __PROD__
          ? {
            browsers: '>2%',
            node: nodeCompat,
          }
          : { node: 'current' },
        useBuiltIns: '@babel/polyfill' in (pkg.dependencies || {}) && 'usage',
      },
    ],
    '@babel/flow',
  ],
}
