'use strict'

const path = require('path')
const { createSyntheticStream } = require('vhd-lib')
const { createWriteStream } = require('fs')
const { getSyncedHandler } = require('@xen-orchestra/fs')
const { Disposable } = require('promise-toolbox')

module.exports = async function synthetize(args) {
  if (args.length < 2 || args.some(_ => _ === '-h' || _ === '--help')) {
    return `Usage: ${this.command} <input VHD> <output VHD>`
  }
  await Disposable.use(getSyncedHandler({ url: 'file:///' }), async handler => {
    const stream = await createSyntheticStream(handler, path.resolve(args[0]))
    return new Promise((resolve, reject) => {
      stream.on('error', reject).pipe(createWriteStream(args[1]).on('error', reject).on('finish', resolve))
    })
  })
}
