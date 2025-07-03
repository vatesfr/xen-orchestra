const { execFileSync } = require('node:child_process')

module.exports = require('../../@xen-orchestra/babel-config')(require('./package.json'), {
  '@babel/preset-env': {
    modules: false,
  },
  'babel-plugin-transform-define': {
    __GIT_COMMIT__: execFileSync('git', ['rev-parse', '--short', 'HEAD']).toString().trim(),
  },
})
