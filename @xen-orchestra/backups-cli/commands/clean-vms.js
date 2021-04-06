#!/usr/bin/env node

// -----------------------------------------------------------------------------

const asyncMap = require('lodash/curryRight')(require('@xen-orchestra/async-map').asyncMap)
const getopts = require('getopts')
const { RemoteAdapter } = require('@xen-orchestra/backups/RemoteAdapter')
const { resolve } = require('path')

const adapter = new RemoteAdapter(require('@xen-orchestra/fs').getHandler({ url: 'file://' }))

module.exports = async function main(args) {
  const { _, remove, merge } = getopts(args, {
    alias: {
      remove: 'r',
      merge: 'm',
    },
    boolean: ['merge', 'remove'],
    default: {
      merge: false,
      remove: false,
    },
  })

  await asyncMap(_, async vmDir => {
    vmDir = resolve(vmDir)
    try {
      await adapter.cleanVm(vmDir, { remove, merge, onLog: log => console.warn(log) })
    } catch (error) {
      console.error('adapter.cleanVm', vmDir, error)
    }
  })
}
