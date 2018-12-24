import Vhd, { checkVhdChain } from 'vhd-lib'
import getopts from 'getopts'
import { getHandler } from '@xen-orchestra/fs'
import { resolve } from 'path'

const checkVhd = (handler, path) =>
  new Vhd(handler, resolve(path)).readHeaderAndFooter()

export default async rawArgs => {
  const { chain, _: args } = getopts(rawArgs, {
    boolean: 'chain',
    default: {
      chain: false,
    },
  })

  const check = chain ? checkVhdChain : checkVhd

  const handler = getHandler({ url: 'file:///' })
  for (const vhd of args) {
    try {
      await check(handler, vhd)
      console.log('ok:', vhd)
    } catch (error) {
      console.error('nok:', vhd, error)
    }
  }
}
