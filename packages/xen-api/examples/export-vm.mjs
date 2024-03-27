#!/usr/bin/env node

import './env.mjs'

import createProgress from 'progress-stream'
import getopts from 'getopts'
import { defer } from 'golike-defer'
import { CancelToken } from 'promise-toolbox'

import { createClient } from '../index.mjs'

import { createOutputStream, formatProgress, pipeline, resolveRecord } from './utils.mjs'

defer(async ($defer, rawArgs) => {
  const {
    gzip,
    zstd,
    _: args,
  } = getopts(rawArgs, {
    boolean: ['gzip', 'zstd'],
  })

  if (args.length < 2) {
    return console.log('Usage: export-vm <XS URL> <VM identifier> [<XVA file>]')
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
  const response = await xapi.getResource(token, '/export/', {
    query: {
      ref: (await resolveRecord(xapi, 'VM', args[1])).$ref,
      use_compression: zstd ? 'zstd' : gzip ? 'true' : 'false',
    },
  })

  console.warn('Export task:', response.headers['task-id'])

  await pipeline(
    response.body,
    createProgress({ time: 1e3 }, p => console.warn(formatProgress(p))),
    createOutputStream(args[2])
  )
})(process.argv.slice(2)).catch(console.error.bind(console, 'error'))
