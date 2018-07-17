import Vhd from 'vhd-lib'
import { getHandler } from '@xen-orchestra/fs'
import { resolve } from 'path'

export default async args => {
  const vhd = new Vhd(getHandler({ url: 'file:///' }), resolve(args[0]))

  try {
    await vhd.readHeaderAndFooter()
  } catch (error) {
    console.warn(error)
    await vhd.readHeaderAndFooter(false)
  }

  console.log(vhd.header)
  console.log(vhd.footer)
}
