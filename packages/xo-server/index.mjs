'use strict'

// ===================================================================

// Enable xo logs by default.
if (process.env.DEBUG === undefined) {
  process.env.DEBUG = 'app-conf,xo:*,-xo:api'
}

// Import the real main module.
export { default } from './dist/index.mjs'
