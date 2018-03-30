import { getHandler } from '@xen-orchestra/fs'
import { Vhd } from '@xen-orchestra/vhd-lib'
import { resolve } from 'path'

export const command = async args => {
  const vhd = new Vhd(getHandler({ url: 'file:///' }), resolve(args[0]))

  await vhd.readHeaderAndFooter()

  console.log(vhd.header)
  console.log(vhd.footer)
}
