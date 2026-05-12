import { RemoteVhdDisk } from './RemoteVhdDisk.mjs'

export { RemoteDisk } from './RemoteDisk.mjs'
export { RemoteVhdDisk } from './RemoteVhdDisk.mjs'
export { openDiskChain } from './openDiskChain.mjs'
export { MergeRemoteDisk } from './MergeRemoteDisk.mjs'

const DISK_EXTENSIONS = ['.vhd']

/**
 * @typedef {import('@xen-orchestra/fs').RemoteHandlerAbstract} RemoteHandlerAbstract
 * @typedef {import('./RemoteDisk.mjs').RemoteDisk} RemoteDisk
 * @typedef {import('./MergeRemoteDisk.mjs').MergeState} MergeState
 */

export function isDisk(path) {
  return DISK_EXTENSIONS.some(ext => path.endsWith(ext))
}

/**
 *
 * @param {Object} params
 * @param {RemoteHandlerAbstract} params.handler
 * @param {string} params.path
 * @param {boolean} [params.force]
 * @param {boolean} [params.ignoreBlockIndexes]
 * @returns {Promise<Disposable<RemoteDisk>>}
 */
export async function openDisposableDisk({ handler, path, force = false, ignoreBlockIndexes = false }) {
  const disk = new RemoteVhdDisk({ handler, path })
  if (ignoreBlockIndexes) {
    // Best-effort init: return the disk even if init fails so that callers
    // can still use operations that work without a fully-opened VHD (e.g. unlink, checkAlias).
    await disk.init({ force, ignoreBlockIndexes }).catch(() => {})
  } else {
    await disk.init({ force })
  }
  return {
    value: disk,
    dispose: () => disk.close(),
  }
}

/**
 * @param {Object} params
 * @param {RemoteHandlerAbstract} params.handler
 * @param {string} params.path
 * @param {boolean} [params.force]
 * @param {boolean} [params.ignoreBlockIndexes]
 * @returns {Promise<RemoteDisk>}
 */
export async function openDisk({ handler, path, force = false, ignoreBlockIndexes = false }) {
  const disk = new RemoteVhdDisk({ handler, path })
  if (ignoreBlockIndexes) {
    // Best-effort init: return the disk even if init fails so that callers
    // can still use operations that work without a fully-opened VHD (e.g. unlink, checkAlias).
    await disk.init({ force, ignoreBlockIndexes }).catch(() => {})
  } else {
    await disk.init({ force })
  }
  return disk
}

/**
 * Deletes VDI directories under `vmDir/vdis/<jobId>/<vdiId>/` that are not in coveredDirs.
 * Used to clean up disk directories that no backup metadata references at all.
 *
 * @param {RemoteHandlerAbstract} handler
 * @param {string} vmDir  - root of the VM backup directory (xo-vm-backups/<vmUuid>)
 * @param {Set<string>} coveredDirs - normalized vdiDir paths already managed by a lineage
 * @param {{ remove?: boolean, logWarn?: Function, logInfo?: Function }} opts
 */
export async function cleanOrphanDiskDirs(
  handler,
  vmDir,
  coveredDirs,
  { remove = false, logWarn = () => {}, logInfo = () => {} } = {}
) {
  const vdisPath = `${vmDir}/vdis`
  let jobDirs
  try {
    jobDirs = await handler.list(vdisPath, { prependDir: true })
  } catch {
    return
  }

  for (const jobDir of jobDirs) {
    let vdiDirs
    try {
      vdiDirs = await handler.list(jobDir, { prependDir: true })
    } catch {
      continue
    }
    for (const vdiDir of vdiDirs) {
      if (!coveredDirs.has(vdiDir)) {
        logWarn('orphan VDI directory, not referenced by any backup', { path: vdiDir })
        if (remove) {
          logInfo('deleting orphan VDI directory', { path: vdiDir })
          try {
            await handler.rmtree(vdiDir)
          } catch (error) {
            logWarn('failed to delete orphan VDI directory', { path: vdiDir, error })
          }
        }
      }
    }
  }
}
