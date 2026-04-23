import { isVhdAlias } from 'vhd-lib/aliases.js'
import { RemoteVhdDisk } from './RemoteVhdDisk.mjs'
import { RemoteVhdDiskChain } from './RemoteVhdDiskChain.mjs'

export { RemoteDisk } from './RemoteDisk.mjs'
export { openDiskChain } from './openDiskChain.mjs'
export { MergeRemoteDisk } from './MergeRemoteDisk.mjs'
export { isVhdAlias } from 'vhd-lib/aliases.js'

export function isVhdFile(filename) {
  return filename.endsWith('.vhd')
}

export function isDiskFile(filename) {
  return isVhdFile(filename)
}

export function isDiskAlias(filename) {
  return isVhdAlias(filename)
}

/**
 * @typedef {import('@xen-orchestra/disk-transform').FileAccessor} FileAccessor
 * @typedef {import('./RemoteDisk.mjs').RemoteDisk} RemoteDisk
 * @typedef {import('./MergeRemoteDisk.mjs').MergeState} MergeState
 */

/**
 * @param {Object} params
 * @param {FileAccessor} params.handler
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
 * Opens one or more disk paths as a single RemoteDisk (or RemoteVhdDiskChain for multiple paths).
 * Use this when merging a chain: pass the child paths as an array; the chain is opened in order
 * from oldest to newest (same order expected by RemoteVhdDiskChain).
 *
 * @param {Object} params
 * @param {FileAccessor} params.handler
 * @param {string[]} params.paths
 * @param {boolean} [params.force]
 * @returns {Promise<RemoteDisk>}
 */
export async function openDiskChainFromPaths({ handler, paths, force = false }) {
  if (paths.length === 1) {
    return openDisk({ handler, path: paths[0], force })
  }
  const disks = paths.map(path => new RemoteVhdDisk({ handler, path }))
  const chain = new RemoteVhdDiskChain({ disks })
  await chain.init({ force })
  return chain
}

/**
 * Deletes VDI directories under `vmDir/vdis/<jobId>/<vdiId>/` that are not in coveredDirs.
 * Used to clean up disk directories that no backup metadata references at all.
 *
 * @param {FileAccessor} handler
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
