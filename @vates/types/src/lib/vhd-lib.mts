import type { Disk } from '@xen-orchestra/disk-transform'
import type { Readable } from 'node:stream'

/**
 * A VHD file being streamed, whose `length` is the exact size of the resulting file.
 *
 * It is set by `DiskConsumerVhdStream` once the geometry is known, before the first byte is
 * emitted, so it can be used as a `Content-Length`.
 */
export type VhdStream = Readable & { length: number }

/**
 * Options accepted by {@link ToVhdStream}.
 *
 * `parentUuid` and `parentPath` describe the parent of a differencing VHD and must be given
 * together, `uuid` identifies the produced VHD itself.
 */
export interface ToVhdStreamOptions {
  parentPath?: string
  parentUuid?: Buffer
  signal?: AbortSignal
  uuid?: Buffer
}

/**
 * Signature of `vhd-lib/disk-consumer/index.mjs`'s `toVhdStream`.
 */
export type ToVhdStream = (disk: Disk, options?: ToVhdStreamOptions) => Promise<VhdStream>
