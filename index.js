'use strict'

// ===================================================================

// Enable xo logs by default.
if (process.env.DEBUG === undefined) {
  process.env.DEBUG = 'app-conf,xen-api,xo:*'
}

// Import the real main module.
module.exports = require('./dist')
