import { asyncEach } from '@vates/async-each'
import { CancelToken } from 'promise-toolbox'

export async function getChangedNbdBlocks(nbdClient, changed, concurrency, blockSize) {
  let nbModified = 0,
    size = 0,
    compressedSize = 0
  const start = new Date()
  console.log('### with concurrency ', concurrency, ' blockSize ', blockSize / 1024 / 1024, 'MB')
  const interval = setInterval(() => {
    console.log(`${nbModified} block handled in ${new Date() - start} ms`)
  }, 5000)
  await asyncEach(
    changed,
    async blockIndex => {
      if (new Date() - start > 30000) {
        return
      }
      const data = await nbdClient.readBlock(blockIndex, blockSize)

      await new Promise(resolve => {
        zlib.gzip(data, { level: zlib.constants.Z_BEST_SPEED }, (_, compressed) => {
          compressedSize += compressed.length
          resolve()
        })
      })
      size += data?.length ?? 0
      nbModified++
    },
    {
      concurrency,
    }
  )
  clearInterval(interval)
  console.log('duration :', new Date() - start)
  console.log('read : ', size, 'octets, compressed: ', compressedSize, 'ratio ', size / compressedSize)
  console.log('speed : ', Math.round(((size / 1024 / 1024) * 1000) / (new Date() - start)), 'MB/s')
  return { speed: Math.round(((size / 1024 / 1024) * 1000) / (new Date() - start)) }
}

export async function getFullBlocks({ nbdClient, concurrency = 1, nbBlocksRead = 1, fd, maxDuration = -1 } = {}) {
  const blockSize = nbBlocksRead * 64 * 1024
  let nbModified = 0,
    size = 0
  console.log('### with concurrency ', concurrency)
  const start = new Date()
  console.log(' max nb blocks ', nbdClient.nbBlocks / nbBlocksRead)
  function* blockIterator() {
    for (let i = 0; i < nbdClient.nbBlocks / nbBlocksRead; i++) {
      yield i
    }
  }
  const interval = setInterval(() => {
    console.log(`${nbModified} block handled in ${new Date() - start} ms`)
  }, 5000)
  await asyncEach(
    blockIterator(),
    async blockIndex => {
      if (maxDuration > 0 && new Date() - start > maxDuration * 1000) {
        return
      }
      const data = await nbdClient.readBlock(blockIndex, blockSize)
      size += data?.length ?? 0
      nbModified++
      if (fd) {
        await fd.write(data, 0, data.length, blockIndex * blockSize)
      }
    },
    {
      concurrency,
    }
  )
  clearInterval(interval)
  if (new Date() - start < 10000) {
    console.warn(
      `data set too small or perofrmance to high, result won't be usefull. Please relaunch with bigger snapshot or higher maximum data size `
    )
  }
  console.log('duration :', new Date() - start)
  console.log('nb blocks : ', nbModified)
  console.log('read : ', size, 'octets')
  const speed = Math.round(((size / 1024 / 1024) * 1000 * 100) / (new Date() - start)) / 100
  console.log('speed : ', speed, 'MB/s')
  return { speed }
}

export async function downloadVhd({ xapi, query, fd, maxDuration = -1 } = {}) {
  const startStream = new Date()
  let sizeStream = 0
  let nbChunk = 0

  const interval = setInterval(() => {
    console.log(`${nbChunk} chunks , ${sizeStream} octets handled in ${new Date() - startStream} ms`)
  }, 5000)
  const stream = await xapi.getResource(CancelToken.none, '/export_raw_vdi/', {
    query,
  })
  for await (const chunk of stream) {
    sizeStream += chunk.length

    if (fd) {
      await fd.write(chunk)
    }
    nbChunk++

    if (maxDuration > 0 && new Date() - startStream > maxDuration * 1000) {
      break
    }
  }
  clearInterval(interval)
  console.log('Stream duration :', new Date() - startStream)
  console.log('Stream read : ', sizeStream, 'octets')
  const speed = Math.round(((sizeStream / 1024 / 1024) * 1000 * 100) / (new Date() - startStream)) / 100
  console.log('speed : ', speed, 'MB/s')
}
