import Disposable from 'promise-toolbox/Disposable'
import { getSyncedHandler } from '@xen-orchestra/fs'
import { scanBlockStore } from '@xen-orchestra/backup-archive/disks/hashed'

/**
 * Maintenance of the block store of a hbd remote: never run by a backup.
 *
 * Without --remove, only reports. To run with no backup job using the remote.
 */
export async function scanStoreCommand(handlerUrl: string, _path: string, extraArgs: string[]): Promise<void> {
  const remove = extraArgs.includes('--remove')
  const verify = extraArgs.includes('--verify')
  const verbose = extraArgs.includes('--verbose')

  await Disposable.use(getSyncedHandler({ url: handlerUrl }), async handler => {
    let corrupted = 0
    const { removed } = await scanBlockStore(handler, {
      remove,
      verify,
      logWarn: (message, data: { path?: string; error?: Error } = {}) => {
        corrupted++
        console.error(`${message}: ${data.path} (${data.error?.message ?? 'unknown error'})`)
      },
      logDebug: verbose
        ? (message, data: { path?: string } = {}) => console.error(`${message}: ${data.path}`)
        : () => {},
    })

    const orphans = remove ? `${removed} removed` : `${removed} found (dry run, use --remove to delete them)`
    console.log(`unused store blocks: ${orphans}`)
    if (verify) {
      console.log(`corrupted store blocks: ${corrupted}`)
    }
  })
}
