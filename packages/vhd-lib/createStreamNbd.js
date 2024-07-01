'use strict'
const { Readable } = require('node:stream')
const { VhdNbd } = require('./Vhd/VhdNbd')
const MAX_DURATION_BETWEEN_PROGRESS_EMIT = 5e3
const MIN_TRESHOLD_PERCENT_BETWEEN_PROGRESS_EMIT = 1

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

exports.createNbdVhdStream = async function createVhdStream(
  nbdClient,
  sourceStream,
  {
    changedBlocks,
    vdiInfos,

    maxDurationBetweenProgressEmit = MAX_DURATION_BETWEEN_PROGRESS_EMIT,
    minTresholdPercentBetweenProgressEmit = MIN_TRESHOLD_PERCENT_BETWEEN_PROGRESS_EMIT,
    onProgress,
  } = {}
) {
  const vhd = new VhdNbd(nbdClient, {
    vhdStream: sourceStream,
    vdiInfos,
    changedBlocks,
  })
  await vhd.readHeaderAndFooter()
  await vhd.readBlockAllocationTable()
  let currentBlockRead = 0
  let lastTimeProgress = 0
  let lastBlockProgress = 0
  // add some condition to trigger onProgress only when significant
  function handleProgress(current, nb) {
    currentBlockRead = current
    const now = Date.now()
    if (
      currentBlockRead - lastBlockProgress > (minTresholdPercentBetweenProgressEmit / 100) * nb ||
      (now - lastTimeProgress > maxDurationBetweenProgressEmit && currentBlockRead !== lastBlockProgress)
    ) {
      lastTimeProgress = now
      lastBlockProgress = currentBlockRead
      onProgress?.(currentBlockRead / nb)
    }
  }
  const stream = await vhd.stream({
    onProgress: handleProgress,
  })
  return stream
}
