import Vhd from 'vhd-lib'
import { getHandler } from '@xen-orchestra/fs'
import { resolve } from 'path'

export default async args => {
  const handler = getHandler({ url: 'file:///' })
  for (const vhd of args) {
    try {
      await new Vhd(handler, resolve(vhd)).readHeaderAndFooter()
      console.log('ok:', vhd)
    } catch (error) {
      console.error('nok:', vhd, error)
    }
  }
}
