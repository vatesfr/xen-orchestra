#!/usr/bin/env node

import './env.mjs'

import { defer } from 'golike-defer'
import { CancelToken } from 'promise-toolbox'

import { createClient } from '../index.mjs'

import { createInputStream, resolveRef } from './utils.mjs'

defer(async ($defer, args) => {
  if (args.length < 1) {
    return console.log('Usage: import-vm <XS URL> [<XVA file>] [<SR identifier>]')
  }

  const xapi = createClient({
    allowUnauthorized: true,
    url: args[0],
    watchEvents: false,
  })

  await xapi.connect()
  $defer(() => xapi.disconnect())

  const { cancel, token } = CancelToken.source()
  process.on('SIGINT', cancel)

  // https://xapi-project.github.io/xen-api/importexport.html
  await xapi.putResource(token, createInputStream(args[1]), '/import/', {
    query: args[2] && { sr_id: await resolveRef(xapi, 'SR', args[2]) },
  })
})(process.argv.slice(2)).catch(console.error.bind(console, 'error'))
