#!/usr/bin/env node

import './env.mjs'

import getopts from 'getopts'
import { defer } from 'golike-defer'
import { CancelToken } from 'promise-toolbox'
import { createVhdStreamWithLength } from 'vhd-lib'

import { createClient } from '../index.mjs'

import { createInputStream, resolveRef } from './utils.mjs'

defer(async ($defer, argv) => {
  const opts = getopts(argv, {
    alias: { proxy: 'p' },
    boolean: ['events', 'raw', 'remove-length'],
    string: ['proxy', 'sr', 'vdi'],
  })

  const url = opts._[0]

  if (url === undefined) {
    return console.log(
      'Usage: import-vdi [--events] [--proxy <URL>] [--raw] [--sr <SR identifier>] [--vdi <VDI identifier>] <XS URL> [<VHD file>]'
    )
  }

  const { raw, sr, vdi } = opts

  const createVdi = vdi === ''
  if (createVdi) {
    if (sr === '') {
      throw 'requires either --vdi or --sr'
    }
    if (!raw) {
      throw 'creating a VDI requires --raw'
    }
  } else if (sr !== '') {
    throw '--vdi and --sr are mutually exclusive'
  }

  const xapi = createClient({
    allowUnauthorized: true,
    httpProxy: opts.proxy || undefined,
    url,
    watchEvents: opts.events && ['task'],
  })

  await xapi.connect()
  $defer(() => xapi.disconnect())

  const { cancel, token } = CancelToken.source()
  process.on('SIGINT', cancel)

  let input = createInputStream(opts._[1])
  $defer.onFailure(() => input.destroy())

  let vdiRef
  if (createVdi) {
    vdiRef = await xapi.call('VDI.create', {
      name_label: 'xen-api/import-vdi',
      other_config: {},
      read_only: false,
      sharable: false,
      SR: await resolveRef(xapi, 'SR', sr),
      type: 'user',
      virtual_size: input.length,
    })
    $defer.onFailure(() => xapi.call('VDI.destroy', vdiRef))
  } else {
    vdiRef = await resolveRef(xapi, 'VDI', vdi)
  }

  if (opts['remove-length']) {
    delete input.length
    console.log('length removed')
  } else if (!raw && input.length === undefined) {
    input = await createVhdStreamWithLength(input)
  }

  // https://xapi-project.github.io/xen-api/snapshots.html#uploading-a-disk-or-snapshot
  const result = await xapi.putResource(token, input, '/import_raw_vdi/', {
    query: {
      format: raw ? 'raw' : 'vhd',
      vdi: vdiRef,
    },
  })

  if (result !== undefined) {
    console.log(result)
  }
})(process.argv.slice(2)).catch(console.error.bind(console, 'Fatal:'))
