// `@xen-orchestra/xapi` is plain JS without published typings:
// only the parts used by the REST API are declared here
declare module '@xen-orchestra/xapi' {
  import { DiskPassthrough } from '@xen-orchestra/disk-transform'
  import type { Xapi, XenApiVdi } from '@vates/types'

  /**
   * Biggest disk size that can be represented in a VHD file.
   *
   * Note: nothing in `vhd-lib` rejects a bigger disk, the geometry is silently
   * clamped instead, therefore callers must check this limit themselves.
   */
  export const VHD_MAX_SIZE: number

  /**
   * @returns a Unix timestamp in seconds, or `null` if the field is empty (as encoded by XAPI)
   */
  export function parseDateTime(input: string | number | Date): number | null

  /**
   * Disk source handling the fallback logic of a VDI export: NBD + CBT, then
   * NBD + stream export for the block list, then plain stream export.
   */
  export class XapiDiskSource extends DiskPassthrough {
    constructor(params: {
      xapi: Xapi
      vdiRef: XenApiVdi['$ref']
      baseRef?: XenApiVdi['$ref']
      preferNbd?: boolean
      nbdConcurrency?: number
      blockSize?: number
      timeout?: number
      onlyListChangedBlocks?: boolean
    })

    useNbd(): boolean
    useCbt(): boolean
  }
}
