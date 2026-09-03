// `vhd-lib` is plain JS without published typings:
// only the parts used by the REST API are declared here
declare module 'vhd-lib/disk-consumer/index.mjs' {
  import type { Disk } from '@xen-orchestra/disk-transform'
  import type { Readable } from 'node:stream'

  /** `length` is the exact size of the generated VHD file */
  export type VhdStream = Readable & { length: number }

  export function toVhdStream(
    disk: Disk,
    options?: { signal?: AbortSignal; uuid?: Buffer; parentUuid?: Buffer; parentPath?: string }
  ): Promise<VhdStream>
}
