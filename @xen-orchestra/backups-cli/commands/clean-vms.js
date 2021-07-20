#!/usr/bin/env node

// -----------------------------------------------------------------------------

const asyncMap = require('lodash/curryRight')(require('@xen-orchestra/async-map').asyncMap)
const getopts = require('getopts')
const { RemoteAdapter } = require('@xen-orchestra/backups/RemoteAdapter')
const { resolve } = require('path')

const adapter = new RemoteAdapter(require('@xen-orchestra/fs').getHandler({ url: 'file://' }))

module.exports = async function main(args) {
  const { _, fix, remove, merge } = getopts(args, {
    alias: {
      fix: 'f',
      remove: 'r',
      merge: 'm',
    },
    boolean: ['fix', 'merge', 'remove'],
    default: {
      merge: false,
      remove: false,
    },
  })

  await asyncMap(_, async vmDir => {
    vmDir = resolve(vmDir)
    try {
      await adapter.cleanVm(vmDir, { fixMetadata: fix, remove, merge, onLog: (...args) => console.warn(...args) })
    } catch (error) {
      console.error('adapter.cleanVm', vmDir, error)
    }
  })
}
