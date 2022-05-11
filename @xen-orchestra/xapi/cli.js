#!/usr/bin/env node

'use strict'

const { Xapi } = require('./')
require('xen-api/dist/cli.js')
  .default(opts => new Xapi(opts))
  .catch(console.error.bind(console, 'FATAL'))
