import asyncIteratorToStream from 'async-iterator-to-stream'
import Disposable from 'promise-toolbox/Disposable'

import { openVhd } from '.'

export default asyncIteratorToStream(async function* (handler, path) {
  await Disposable.use(async function* () {
    const vhd = yield openVhd(handler, path)
    await vhd.readBlockAllocationTable()
    const {
      footer: { currentSize },
      header: { blockSize },
    } = vhd
    const nFullBlocks = Math.floor(currentSize / blockSize)
    const nLeftoverBytes = currentSize % blockSize

    const emptyBlock = Buffer.alloc(blockSize)
    for (let i = 0; i < nFullBlocks; ++i) {
      yield vhd.containsBlock(i) ? (await vhd.readBlock(i)).data : emptyBlock
    }
    if (nLeftoverBytes !== 0) {
      yield (vhd.containsBlock(nFullBlocks) ? (await vhd.readBlock(nFullBlocks)).data : emptyBlock).slice(
        0,
        nLeftoverBytes
      )
    }
  })
})
