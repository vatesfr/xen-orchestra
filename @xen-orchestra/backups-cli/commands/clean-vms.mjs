import { asyncMap as rawAsyncMap } from '@xen-orchestra/async-map'
import { RemoteAdapter } from '@xen-orchestra/backups/RemoteAdapter.js'
import { getHandler } from '@xen-orchestra/fs'
import getopts from 'getopts'
import curryRight from 'lodash/curryRight.js'
import { resolve } from 'path'

const asyncMap = curryRight(rawAsyncMap)

const adapter = new RemoteAdapter(getHandler({ url: 'file://' }))

export default async function cleanVms(args) {
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
      await adapter.cleanVm(vmDir, {
        fixMetadata: fix,
        remove,
        merge,
        logInfo: (...args) => console.log(...args),
        logWarn: (...args) => console.warn(...args),
      })
    } catch (error) {
      console.error('adapter.cleanVm', vmDir, error)
    }
  })
}
