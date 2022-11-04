'use strict'

const { openVhd, VhdSynthetic } = require('vhd-lib')
const getopts = require('getopts')
const { getSyncedHandler } = require('@xen-orchestra/fs')
const { Disposable } = require('promise-toolbox')

module.exports = async function check(rawArgs) {
  const { chain, bat, blocks, remote, _: args } = getopts(rawArgs, {
    boolean: ['chain', 'bat', 'blocks'],
    default: {
      chain: false,
      bat: false,
      blocks: false
    },
  })

  const vhdPath = args[0]

  await Disposable.factory( async function * open(remote, vhdPath) {
    const handler = yield getSyncedHandler({url : remote ?? 'file:///'})
    const vhd = chain? yield VhdSynthetic.fromVhdChain(handler, vhdPath) : yield openVhd(handler, vhdPath)

    await vhd.readBlockAllocationTable()
    if(bat){
      const nBlocks = vhd.header.maxTableEntries
      let nbErrors = 0
      for (let blockId = 0; blockId < nBlocks; ++blockId) {
        if(!vhd.containsBlock(blockId)){
         continue
        }
        const ok = await vhd.checkBlock(blockId)
        if(!ok){
          console.warn(`block ${blockId} is invalid`)
          nbErrors ++
        }
      }
      console.log('BAT check done ', nbErrors === 0  ? 'OK':  `${nbErrors} block(s) faileds`)
    }
    if(blocks){
      for await(const _ of vhd.blocks()){

      }
      console.log('Blocks check done')
    }
  })(remote, vhdPath)
}
