import { asyncEach } from '@vates/async-each'
import { RemoteAdapter } from '@xen-orchestra/backups/RemoteAdapter.mjs'
import { getSyncedHandler } from '@xen-orchestra/fs'
import getopts from 'getopts'
import { basename, dirname, join } from 'path'
import Disposable from 'promise-toolbox/Disposable'
import { pathToFileURL } from 'url'

async function cleanFiles(vmDirs, { fix, merge, remove }) {
  let nbSucceed = 0
  let nbFailed = 0
  let nbStarted = 0
  const total = vmDirs.length
  // don't assume all the files uses the same remote
  await asyncEach(
    vmDirs,
    vmDir =>
      Disposable.use(getSyncedHandler({ url: pathToFileURL(dirname(vmDir)).href }), async handler => {
        try {
          nbStarted++
          await new RemoteAdapter(handler).cleanVm(basename(vmDir), {
            fixMetadata: fix,
            remove,
            merge,
            logInfo: (...args) => console.log(...args),
            logWarn: (...args) => console.warn(...args),
          })
          nbSucceed++
        } catch (error) {
          nbFailed++
          console.error('adapter.cleanVm', vmDir, error, { nbStarted, nbSucceed, nbFailed, total })
        }
      }),
    { concurrency: 2 }
  )
  console.log('done', { nbSucceed, nbFailed })
}

async function cleanRemote(url, { fix, merge, remove }) {
  let nbSucceed = 0
  let nbFailed = 0
  let nbStarted = 0
  await Disposable.use(getSyncedHandler({ url }), async handler => {
    const remoteAdapter = new RemoteAdapter(handler)
    const vmUuids = await remoteAdapter.listAllVms()
    const total = vmUuids.length
    await asyncEach(
      vmUuids,
      async vmUuid => {
        try {
          nbStarted++
          await remoteAdapter.cleanVm(join('xo-vm-backups', vmUuid), {
            fixMetadata: fix,
            remove,
            merge,
            logInfo: (...args) => console.log(...args),
            logWarn: (...args) => console.warn(...args),
          })
          nbSucceed++
        } catch (error) {
          nbFailed++
          console.error('adapter.cleanVm', vmUuid, error, { nbStarted, nbSucceed, nbFailed, total })
        }
      },
      { concurrency: 2 }
    )
  })
  console.log('done', { nbSucceed, nbFailed })
}

export default async function cleanVms(args) {
  const {
    _: vmDirs,
    fix,
    remote,
    remove,
    merge,
  } = getopts(args, {
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

  if (remote) {
    return cleanRemote(remote, { fix, merge, remove })
  } else {
    return cleanFiles(vmDirs, { fix, merge, remove })
  }
}
