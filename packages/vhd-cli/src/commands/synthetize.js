import path from 'path'
import { createSyntheticStream } from 'vhd-lib'
import { createWriteStream } from 'fs'
import { getHandler } from '@xen-orchestra/fs'

export default async function main(args) {
  if (args.length < 2 || args.some(_ => _ === '-h' || _ === '--help')) {
    return `Usage: ${this.command} <input VHD> <output VHD>`
  }

  const handler = getHandler({ url: 'file:///' })
  const stream = await createSyntheticStream(handler, path.resolve(args[0]))
  return new Promise((resolve, reject) => {
    stream.on('error', reject).pipe(createWriteStream(args[1]).on('error', reject).on('finish', resolve))
  })
}
