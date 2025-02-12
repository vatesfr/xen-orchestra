import { Disk } from '../Disk.mjs'

/**
 *
 * @param disk utility method that consume a disk and show the speed
 */

export async function consume(disk: Disk) {
  const start = Date.now()
  let consumed = 0,
    nbBlocks = 0

  for await (const block of disk.diskBlocks()) {
    consumed += block.data.length
    nbBlocks++
  }
  const end = Date.now()
  const duration = end - start
  console.log({
    duration, // in ms
    nbBlocks,
    consumed: Math.round(consumed / 1024 / 1024), // in MB
    speed: Math.round((consumed * 1000) / duration / 1024 / 1024), // in MB/s
  })
}
