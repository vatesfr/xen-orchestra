'use strict'

// ===================================================================

// Enable xo logs by default.
if (process.env.DEBUG === undefined) {
  process.env.DEBUG = 'app-conf,xen-api,xo:*'
}

// Better stack traces.
require('clarify')
require('source-map-support/register')
require('trace')

// Import the real main module.
module.exports = require('./dist')
