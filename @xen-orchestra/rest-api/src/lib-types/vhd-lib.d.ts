// `vhd-lib` is plain JS without published typings: this only binds the names used by the REST API
// to the shapes declared in `@vates/types`
declare module 'vhd-lib/disk-consumer/index.mjs' {
  import type { ToVhdStream } from '@vates/types'

  export const toVhdStream: ToVhdStream
}
