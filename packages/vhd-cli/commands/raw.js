'use strict'

const { openVhd } = require('vhd-lib')
const { getSyncedHandler } = require('@xen-orchestra/fs')
const { resolve } = require('path')

const { writeStream } = require('../_utils')
const { Disposable } = require('promise-toolbox')

module.exports = async function raw(args) {
  if (args.length < 2 || args.some(_ => _ === '-h' || _ === '--help')) {
    return `Usage: ${this.command} <input VHD> [<output raw>]`
  }

  await Disposable.use(async function* () {
    const handler = getSyncedHandler({ url: 'file:///' })
    const vhd = openVhd(handler, resolve(args[0]))
    await writeStream(vhd.rawContent())
  })
}
