'use strict'

const { Bar } = require('cli-progress')
const { getSyncedHandler } = require('@xen-orchestra/fs')
const { mergeVhdChain } = require('vhd-lib/merge')
const { Disposable } = require('promise-toolbox')

module.exports = async function merge(args) {
  if (args.length < 3 || args.some(_ => _ === '-h' || _ === '--help')) {
    return `Merges two VHDs.
    Usage: ${this.command} <remote URL> <child VHD path on remote> <parent VHD path on remote>`
  }
  const unexpectedArgs = args.filter(arg => arg.startsWith('-'))
  if (unexpectedArgs.length > 0) {
    return `Option${unexpectedArgs.length > 1 ? 's' : ''} ${unexpectedArgs} unsupported, use --help for details.`
  }

  await Disposable.use(getSyncedHandler({ url: args[0] }), async handler => {
    let bar
    await mergeVhdChain(handler, [args[2], args[1]], {
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
