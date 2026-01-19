'use strict'

const { VhdFile, checkVhdChain } = require('vhd-lib')
const getopts = require('getopts')
const { getSyncedHandler } = require('@xen-orchestra/fs')
const { Disposable } = require('promise-toolbox')

const checkVhd = (handler, path) => new VhdFile(handler, path).readHeaderAndFooter()

module.exports = async function check(rawArgs) {
  const {
    chain,
    c,
    help,
    h,
    _: args,
    ...unexpectedArgs
  } = getopts(rawArgs, {
    alias: {
      chain: 'c',
      help: 'h',
    },
    boolean: ['chain', 'help'],
    default: {
      chain: false,
      help: false,
    },
  })

  if (args.length < 2 || help) {
    return `Checks for the integrity of one or more VHDs.
    Use option --chain to check for VHD directory/ies.
    Usage: ${this.command} [--chain] <remote URL> <VHD path on remote> <another VHD path (optional)> ...`
  }
  const unexpectedArgsList = Object.keys(unexpectedArgs)
  if (unexpectedArgsList.length > 0) {
    return `Option${unexpectedArgsList.length > 1 ? 's' : ''} ${unexpectedArgsList} unsupported, use --help for details.`
  }

  const check = chain ? checkVhdChain : checkVhd
  await Disposable.use(getSyncedHandler({ url: args.shift() }), async handler => {
    for (const vhd of args) {
      try {
        await check(handler, vhd)
        console.log('ok:', vhd)
      } catch (error) {
        console.error('nok:', vhd, error)
      }
    }
  })
}
