// `vhd-lib` is plain JS without published typings: this only binds the names used by the REST API
//
// @todo move these types to `@vates/types` so `@xen-orchestra/disk-cli`, which declares the same
// module on its own, shares them
declare module 'vhd-lib/disk-consumer/index.mjs' {
  import type { Disk } from '@xen-orchestra/disk-transform'
  import type { Readable } from 'node:stream'

  /**
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
   * The `length` of the returned stream is the exact size of the resulting VHD file.
   *
   * It is set by `DiskConsumerVhdStream` once the geometry is known, before the first byte is
   * emitted, so it can be used as a `Content-Length`.
   */
  export function toVhdStream(disk: Disk, options?: ToVhdStreamOptions): Promise<Readable & { length: number }>
}
