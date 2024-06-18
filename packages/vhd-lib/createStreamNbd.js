'use strict'
const { Readable } = require('node:stream')
const { VhdNbd } = require('./Vhd/VhdNbd')

exports.createNbdRawStream = function createRawStream(nbdClient) {
  const exportSize = Number(nbdClient.exportSize)
  const chunkSize = 2 * 1024 * 1024

  const indexGenerator = function* () {
    const nbBlocks = Math.ceil(exportSize / chunkSize)
    for (let index = 0; index < nbBlocks; index++) {
      yield { index, size: chunkSize }
    }
  }
  const stream = Readable.from(nbdClient.readBlocks(indexGenerator), { objectMode: false })

  stream.on('error', () => nbdClient.disconnect())
  stream.on('end', () => nbdClient.disconnect())
  return stream
}

exports.createNbdVhdStream = async function createVhdStream(nbdClient, sourceStream) {
  const vhd = new VhdNbd(nbdClient, {
    vhdStream: sourceStream,
  })
  await vhd.readHeaderAndFooter()
  await vhd.readBlockAllocationTable()
  const stream = await vhd.stream()
  stream._nbd = true
  return vhd.stream()
}
