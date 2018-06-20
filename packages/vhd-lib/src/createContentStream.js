import asyncIteratorToStream from 'async-iterator-to-stream'

import Vhd from './vhd'

export default asyncIteratorToStream(async function * (handler, path) {
  const fd = await handler.openFile(path, 'r')
  try {
    const vhd = new Vhd(handler, fd)
    await vhd.readHeaderAndFooter()
    await vhd.readBlockAllocationTable()
    const {
      footer: { currentSize },
      header: { blockSize },
    } = vhd
    const nFullBlocks = Math.floor(currentSize / blockSize)
    const nLeftoverBytes = currentSize % blockSize

    const emptyBlock = Buffer.alloc(blockSize)
    for (let i = 0; i < nFullBlocks; ++i) {
      yield vhd.containsBlock(i) ? (await vhd._readBlock(i)).data : emptyBlock
    }
    if (nLeftoverBytes !== 0) {
      yield (vhd.containsBlock(nFullBlocks)
        ? (await vhd._readBlock(nFullBlocks)).data
        : emptyBlock
      ).slice(0, nLeftoverBytes)
    }
  } finally {
    await handler.closeFile(fd)
  }
})
