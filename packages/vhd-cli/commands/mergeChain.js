'use strict'

const { Bar } = require('cli-progress')
const { getHandler } = require('@xen-orchestra/fs')
const { mergeVhdChain } = require('vhd-lib/merge')
const { VhdSynthetic } = require('vhd-lib')
const { Disposable } = require('promise-toolbox')

module.exports = async function merge(args) {
  if (args.length < 1 || args.some(_ => _ === '-h' || _ === '--help')) {
    return `Usage: ${this.command} <VHD>`
  }

  const handler = getHandler({ url: 'file:///' })
  let bar
  await Disposable.use(VhdSynthetic.fromVhdChain(handler, args[0]), async syntheticVhd => {
    const chainPaths = syntheticVhd.vhds.map(({ _path }) => _path)
    console.log({ chainPaths })
    await mergeVhdChain(handler, chainPaths, {
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
  })
  bar.stop()
  console.log('you must delete the cache.json.gz file to ensure the changes are visible in XO UI')
}
