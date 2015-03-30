'use strict'

// ===================================================================

// Enable xo logs by default.
if (process.env.DEBUG === undefined) {
  process.env.DEBUG = 'xo:*'
}

// Enable source maps support for traces.
require('source-map-support').install()

// Import the real main module.
module.exports = require('./dist')
