#!/usr/bin/env node

require('xen-api/dist/cli')
  .default(process.argv.slice(2), require('./').Xapi)
  .catch(error => {
    console.error('FATAL:', error)
  })
