import { RemoteVhdDisk } from './RemoteVhdDisk.mjs'
import { openDiskChain } from './openDiskChain.mjs'
import { ReadAhead } from '@xen-orchestra/disk-transform'
import { VhdDirectory, VhdSynthetic } from 'vhd-lib'
import { toVhdStream, writeToVhdDirectory } from 'vhd-lib/disk-consumer/index.mjs'
import Disposable from 'promise-toolbox/Disposable'

export { RemoteDisk } from './RemoteDisk.mjs'
export { RemoteVhdDisk } from './RemoteVhdDisk.mjs'
export { openDiskChain } from './openDiskChain.mjs'
export { MergeRemoteDisk } from './MergeRemoteDisk.mjs'

const DISK_EXTENSIONS = ['.vhd']

const noop = () => {}

/**
 * @typedef {import('@xen-orchestra/fs').RemoteHandlerAbstract} RemoteHandlerAbstract
 * @typedef {import('./RemoteDisk.mjs').RemoteDisk} RemoteDisk
 * @typedef {import('./MergeRemoteDisk.mjs').MergeState} MergeState
 */

export function isDisk(path) {
  return DISK_EXTENSIONS.some(ext => path.endsWith(ext))
}

/**
 * Open a disk for reading, either as a single VHD or as a chain of ancestors up to
 * the first full one, wrapped in a ReadAhead for sequential-read performance.
 *
 * @param {RemoteHandlerAbstract} handler
 * @param {string} path
 * @param {{ useChain?: boolean }} opts
 * @returns {Promise<RemoteDisk>}
 */
export async function createVhdDisk(handler, path, { useChain }) {
  let disk
  if (useChain) {
    disk = await openDiskChain({ handler, path })
  } else {
    disk = new RemoteVhdDisk({ handler, path })
    await disk.init()
  }
  disk = new ReadAhead(disk)
  return disk
}

/**
 * Write a Disk as a VHD, either as a VHD directory or as a streamed VHD file.
 * `outputStream` is injected so the caller (which owns stream-size accounting) handles
 * the streaming branch; the directory branch reports its own size.
 *
 * @param {RemoteHandlerAbstract} handler
 * @param {string} path
 * @param {import('@xen-orchestra/disk-transform').Disk} disk
 * @param {Object} opts
 * @param {boolean} opts.useVhdDirectory
 * @param {Function} [opts.validator]
 * @param {number} [opts.writeBlockConcurrency]
 * @param {(path: string, input: any, opts: object) => Promise<number>} opts.outputStream
 * @returns {Promise<number>}
 */
export async function writeVhd(
  handler,
  path,
  disk,
  { useVhdDirectory, validator = noop, writeBlockConcurrency, outputStream }
) {
  if (useVhdDirectory) {
    return await writeToVhdDirectory({
      disk,
      target: {
        handler,
        path,
        concurrency: writeBlockConcurrency,
        validator,
        compression: 'brotli',
      },
    })
  } else {
    const stream = await toVhdStream(disk)
    const size = await outputStream(path, stream, { validator, checksum: false })
    await validator(path)
    return size
  }
}

/**
 * Check whether a VHD created in this adapter can be merged with the VHD chain at `path`:
 * the chain's base UUID must match, and its storage class/compression must be compatible
 * with the target remote's layout.
 *
 * @param {RemoteHandlerAbstract} handler
 * @param {Buffer} packedParentUid
 * @param {string} path
 * @param {{ useVhdDirectory: boolean, compressionType: string }} opts
 * @returns {Promise<boolean>}
 */
export async function isMergeableParent(handler, packedParentUid, path, { useVhdDirectory, compressionType }) {
  return await Disposable.use(VhdSynthetic.fromVhdChain(handler, path), vhd => {
    // this baseUuid is not linked with this vhd
    if (!vhd.footer.uuid.equals(packedParentUid)) {
      return false
    }

    // check if all the chain is composed of vhd directory
    const isVhdDirectory = vhd.checkVhdsClass(VhdDirectory)
    return isVhdDirectory ? useVhdDirectory && compressionType === vhd.compressionType : !useVhdDirectory
  })
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
        // TODO: readd logWarn when rmtree() is added below
        if (remove) {
          logInfo('you could delete orphan VDI directory', { path: vdiDir })
          // TODO: Readd rmtree() when codebase is ready
        }
      }
    }
  }
}
