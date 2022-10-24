'use strict'

const { Bar } = require('cli-progress')
const { getSyncedHandler } = require('@xen-orchestra/fs')
const { mergeVhdChain } = require('vhd-lib/merge')
const { resolve } = require('path')
const { Disposable } = require('promise-toolbox')

module.exports = async function merge(args) {
  if (args.length < 2 || args.some(_ => _ === '-h' || _ === '--help')) {
    return `Usage: ${this.command} <child VHD> <parent VHD>`
  }

  await Disposable.use(getSyncedHandler({ url: 'file:///' }), async handler => {
    let bar
    await mergeVhdChain(handler, [resolve(args[1]), resolve(args[0])], {
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
  })
}
