#!/usr/bin/env node

'use strict'

const { Xapi } = require('./')
require('xen-api/dist/cli.js')
  .default(opts => new Xapi({ ignoreNobakVdis: true, ...opts }))
  .catch(console.error.bind(console, 'FATAL'))
