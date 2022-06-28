'use strict'

const { Bar } = require('cli-progress')
const { mergeVhd } = require('vhd-lib')
const { getHandler } = require('@xen-orchestra/fs')
const { resolve } = require('path')

module.exports = async function merge(args) {
  if (args.length < 2 || args.some(_ => _ === '-h' || _ === '--help')) {
    return `Usage: ${this.command} <child VHD> <parent VHD>`
  }

  const handler = getHandler({ url: 'file:///' })
  let bar
  await mergeVhd(handler, resolve(args[1]), handler, resolve(args[0]), {
    onProgress({ done, total }) {
      if (bar === undefined) {
        bar = new Bar({
          format: 'merging [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
        })
        bar.start(total, done)
      } else {
        bar.update(done)
      }
    },
  })
  bar.stop()
}
