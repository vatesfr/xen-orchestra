#!/usr/bin/env node

// assigned when options are parsed by the main function
let merge, remove

// -----------------------------------------------------------------------------

const asyncMap = require('lodash/curryRight')(require('@xen-orchestra/async-map').asyncMap)
const getopts = require('getopts')
const lockfile = require('proper-lockfile')
const { RemoteAdapter } = require('@xen-orchestra/backups/RemoteAdapter')
const { resolve } = require('path')

const handler = require('@xen-orchestra/fs').getHandler({ url: 'file://' })

// TODO: pass debounceResource when using other method than `cleanVm`
const adapter = new RemoteAdapter(handler)

module.exports = async function main(args) {
  const opts = getopts(args, {
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

  ;({ remove, merge } = opts)
  await asyncMap(opts._, async vmDir => {
    vmDir = resolve(vmDir)

    // TODO: implement this in `xo-server`, not easy because not compatible with
    // `@xen-orchestra/fs`.
    const release = await lockfile.lock(vmDir)
    try {
      await adapter.cleanVm(vmDir, { remove, merge, onLog: log => console.warn(log) })
    } catch (error) {
      console.error('adapter.cleanVm', vmDir, error)
    } finally {
      await release()
    }
  })
}
