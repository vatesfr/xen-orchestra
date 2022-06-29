'use strict'

const path = require('path')
const { createSyntheticStream } = require('vhd-lib')
const { createWriteStream } = require('fs')
const { getHandler } = require('@xen-orchestra/fs')

module.exports = async function synthetize(args) {
  if (args.length < 2 || args.some(_ => _ === '-h' || _ === '--help')) {
    return `Usage: ${this.command} <input VHD> <output VHD>`
  }

  const handler = getHandler({ url: 'file:///' })
  const stream = await createSyntheticStream(handler, path.resolve(args[0]))
  return new Promise((resolve, reject) => {
    stream.on('error', reject).pipe(createWriteStream(args[1]).on('error', reject).on('finish', resolve))
  })
}
