module.exports = require('../../@xen-orchestra/babel-config')(require('./package.json'), {
  '@babel/preset-env': {
    exclude: ['@babel/plugin-transform-regenerator'],
  },
})
