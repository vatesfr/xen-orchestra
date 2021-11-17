import { openVhd } from 'vhd-lib'
import { getSyncedHandler } from '@xen-orchestra/fs'
import { resolve } from 'path'

import { writeStream } from '../_utils'
import { Disposable } from 'promise-toolbox'

export default async args => {
  if (args.length < 2 || args.some(_ => _ === '-h' || _ === '--help')) {
    return `Usage: ${this.command} <input VHD> [<output raw>]`
  }

  await Disposable.use(async function* () {
    const handler = getSyncedHandler({ url: 'file:///' })
    const vhd = openVhd(handler, resolve(args[0]))
    await writeStream(vhd.rawContent())
  })
}
