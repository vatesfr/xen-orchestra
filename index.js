'use strict'

// ===================================================================

// Enable xo logs by default.
if (process.env.DEBUG === undefined) {
  process.env.DEBUG = 'app-conf,xen-api,xo:*'
}

// Better stack traces if possible.
try { require('clarify') } catch (_) {}
try { require('source-map-support/register') } catch (_) {}
try { require('trace') } catch (_) {}

// Import the real main module.
module.exports = require('./dist')
