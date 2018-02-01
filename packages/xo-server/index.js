'use strict'

// ===================================================================

// Enable xo logs by default.
if (process.env.DEBUG === undefined) {
  process.env.DEBUG = 'app-conf,xo:*,-xo:api'
}

// Import the real main module.
module.exports = require('./dist').default // eslint-disable-line node/no-missing-require
