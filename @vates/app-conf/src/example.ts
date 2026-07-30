'use strict'

// ===================================================================

const appconf = require('.')

// ===================================================================

appconf.load('my-application').then(function (config: any) {
  // eslint-disable-next-line no-console
  console.log(config)
})
