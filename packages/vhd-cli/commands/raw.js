'use strict'

const { openVhd } = require('vhd-lib')
const { getSyncedHandler } = require('@xen-orchestra/fs')
const { resolve } = require('path')

const { writeStream } = require('../_utils')
const { Disposable } = require('promise-toolbox')

module.exports = async function raw(args) {
  if (args.length < 3 || args.some(_ => _ === '-h' || _ === '--help')) {
    return `Exports VHD as raw file.
    Usage: ${this.command} <remote URL> <input VHD path on remote> [<output raw>]`
  }
  const unexpectedArgs = args.filter(arg => arg.startsWith('-'))
  if (unexpectedArgs.length > 0) {
    return `Option${unexpectedArgs.length > 1 ? 's' : ''} ${unexpectedArgs} unsupported, use --help for details.`
  }

  await Disposable.use(async function* () {
    const handler = yield getSyncedHandler({ url: args[0] })
    const vhd = yield openVhd(handler, args[1])
    await vhd.readBlockAllocationTable()
    await writeStream(vhd.rawContent(), resolve(args[2]))
  })
}
