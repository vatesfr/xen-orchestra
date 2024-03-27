#!/usr/bin/env node

import './env.mjs'

import createProgress from 'progress-stream'
import createTop from 'process-top'
import getopts from 'getopts'
import { defer } from 'golike-defer'
import { CancelToken } from 'promise-toolbox'

import { createClient } from '../index.mjs'

import { createOutputStream, formatProgress, pipeline, resolveRecord, throttle } from './utils.mjs'

defer(async ($defer, rawArgs) => {
  const {
    proxy,
    raw,
    throttle: bps,
    _: args,
  } = getopts(rawArgs, {
    boolean: 'raw',
    string: ['proxy'],
    alias: {
      proxy: 'p',
      raw: 'r',
      throttle: 't',
    },
  })

  if (args.length < 2) {
    return console.log('Usage: export-vdi [--proxy <URL>] [--raw] <XS URL> <VDI identifier> [<VHD file>]')
  }

  const xapi = createClient({
    allowUnauthorized: true,
    httpProxy: proxy || undefined,
    url: args[0],
    watchEvents: false,
  })

  await xapi.connect()
  $defer(() => xapi.disconnect())

  const { cancel, token } = CancelToken.source()
  process.on('SIGINT', cancel)

  const vdi = await resolveRecord(xapi, 'VDI', args[1])

  // https://xapi-project.github.io/xen-api/snapshots.html#downloading-a-disk-or-snapshot
  const response = await xapi.getResource(token, '/export_raw_vdi/', {
    query: {
      format: raw ? 'raw' : 'vhd',
      vdi: vdi.$ref,
    },
  })

  console.warn('Export task:', response.headers['task-id'])

  const top = createTop()
  const progressStream = createProgress()

  $defer(
    clearInterval,
    setInterval(() => {
      console.warn('\r %s | %s', top.toString(), formatProgress(progressStream.progress()))
    }, 1e3)
  )

  await pipeline(response.body, progressStream, throttle(bps), createOutputStream(args[2]))
})(process.argv.slice(2)).catch(console.error.bind(console, 'error'))
