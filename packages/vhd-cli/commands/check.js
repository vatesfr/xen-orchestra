'use strict'

const { VhdFile, checkVhdChain } = require('vhd-lib')
const getopts = require('getopts')
const { getSyncedHandler } = require('@xen-orchestra/fs')
const { resolve } = require('path')
const { Disposable } = require('promise-toolbox')

const checkVhd = (handler, path) => new VhdFile(handler, path).readHeaderAndFooter()

module.exports = async function check(rawArgs) {
  const { chain, _: args } = getopts(rawArgs, {
    boolean: ['chain'],
    default: {
      chain: false,
    },
  })

  const check = chain ? checkVhdChain : checkVhd
  await Disposable.use(getSyncedHandler({ url: 'file:///' }), async handler => {
    for (const vhd of args) {
      try {
        await check(handler, resolve(vhd))
        console.log('ok:', vhd)
      } catch (error) {
        console.error('nok:', vhd, error)
      }
    }
  })
}
