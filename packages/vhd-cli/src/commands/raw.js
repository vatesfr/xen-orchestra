import { createContentStream } from 'vhd-lib'
import { getHandler } from '@xen-orchestra/fs'
import { resolve } from 'path'

import { writeStream } from '../_utils'

export default async args => {
  if (args.length < 2 || args.some(_ => _ === '-h' || _ === '--help')) {
    return `Usage: ${this.command} <input VHD> [<output raw>]`
  }

  await writeStream(
    createContentStream(getHandler({ url: 'file:///' }), resolve(args[0])),
    args[1]
  )
}
