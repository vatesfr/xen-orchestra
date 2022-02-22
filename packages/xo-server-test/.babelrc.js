'use strict'

const pkg = require('./package.json')

// `xo-server-test` is a special package which has no dev dependencies but our
// babel config generator only looks in `devDependencies`.
require('assert').strictEqual(pkg.devDependencies, undefined)
pkg.devDependencies = pkg.dependencies

module.exports = require('../../@xen-orchestra/babel-config')(pkg)
