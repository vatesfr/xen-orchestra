// `@xen-orchestra/xapi` is plain JS without published typings: this only binds the names used by
// the REST API to the shapes declared in `@vates/types`
declare module '@xen-orchestra/xapi' {
  import type { ParseDateTime, XapiDiskSource, XapiDiskSourceOptions } from '@vates/types'

  /**
   * Biggest disk size that can be represented in a VHD file.
   *
   * Note: nothing in `vhd-lib` rejects a bigger disk, the geometry is silently
   * clamped instead, therefore callers must check this limit themselves.
   */
  export const VHD_MAX_SIZE: number

  export const parseDateTime: ParseDateTime

  export const XapiDiskSource: new (params: XapiDiskSourceOptions) => XapiDiskSource
}
