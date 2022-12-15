import { asyncMap } from '@xen-orchestra/async-map'
import { RemoteAdapter } from '@xen-orchestra/backups/RemoteAdapter.js'
import { getSyncedHandler } from '@xen-orchestra/fs'
import getopts from 'getopts'
import { basename, dirname } from 'path'
import Disposable from 'promise-toolbox/Disposable'
import { pathToFileURL } from 'url'

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

  await asyncMap(_, vmDir =>
    Disposable.use(getSyncedHandler({ url: pathToFileURL(dirname(vmDir)).href }), async handler => {
      try {
        await new RemoteAdapter(handler).cleanVm(basename(vmDir), {
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
  )
}
