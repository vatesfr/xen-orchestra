const config = (module.exports = require('../../@xen-orchestra/babel-config')(
  require('./package.json')
))

// https://webpack.js.org/guides/tree-shaking/
config.presets.find(_ => _[0] === '@babel/preset-env')[1].modules = false
