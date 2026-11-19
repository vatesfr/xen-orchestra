#!/usr/bin/env node

import './env.mjs'

import { defer } from 'golike-defer'

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

  const controller = new AbortController()
  process.on('SIGINT', () => controller.abort())

  // https://xapi-project.github.io/xen-api/importexport.html
  await xapi.putResource(controller.signal, createInputStream(args[1]), '/import/', {
    query: args[2] && { sr_id: await resolveRef(xapi, 'SR', args[2]) },
  })
})(process.argv.slice(2)).catch(console.error.bind(console, 'error'))
