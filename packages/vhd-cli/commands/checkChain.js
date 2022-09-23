'use strict'

const { Bar } = require('cli-progress')
const { getHandler } = require('@xen-orchestra/fs')
const { VhdSynthetic } = require('vhd-lib')
const { Disposable } = require('promise-toolbox')

async function checkOneVhd(vhd) {
  await vhd.readBlockAllocationTable()
  const nBlocks = vhd.header.maxTableEntries
  const bar = new Bar({
    format: '[{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
  })
  bar.start(nBlocks, 0)
  const missings = []
  for (let blockId = 0; blockId < nBlocks; ++blockId) {
    bar.update(blockId)
    try {
      if (vhd.containsBlock(blockId)) {
        await vhd.readBlock(blockId)
      }
    } catch (error) {
      console.log('missing block ', blockId)
      missings.push(blockId)
      if (missings.length > 1000) {
        throw new Error('Too much missing blocks')
      }
    }
  }
  bar.update(nBlocks)
  bar.stop()
  return missings
}

module.exports = async function merge(args) {
  if (args.length < 1 || args.some(_ => _ === '-h' || _ === '--help')) {
    return `Usage: ${this.command} <VHD>`
  }

  const handler = getHandler({ url: 'file:///' })

  await Disposable.use(VhdSynthetic.fromVhdChain(handler, args[0]), async syntheticVhd => {
    console.log('Check full VHD')
    const missings = await checkOneVhd(syntheticVhd)
    if (missings.length > 0) {
      console.log(`${missings.length} blocks are missing`)
    } else {
      console.log('VHD data are ok')
    }
  })
}
