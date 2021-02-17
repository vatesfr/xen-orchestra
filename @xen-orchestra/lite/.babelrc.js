const config = (module.exports = require('../../@xen-orchestra/babel-config')(require('./package.json')))

config.presets.find(_ => _[0] === '@babel/preset-env')[1].targets.esmodules = true
