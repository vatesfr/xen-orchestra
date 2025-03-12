// @ts-expect-error async-each is not typed
import { asyncEach } from '@vates/async-each'
import { Disk, DiskBlock } from '../Disk.mjs'
import { DebugDisk } from './DebugDisk.mjs'

/**
 *
 * @param disk utility method that consume a disk and show the speed
 */

export async function consume(disk: Disk, { blockDelay = 20, concurrency = 8 } = {}) {
  const start = Date.now()
  let consumed = 0,
    nbBlocks = 0

  await asyncEach(
    disk.diskBlocks(),
    async (block: DiskBlock) => {
      consumed += block.data.length
      nbBlocks++
      await new Promise(resolve => setTimeout(resolve, blockDelay))
    },
    { concurrency }
  )
  const end = Date.now()
  const duration = end - start
  console.log('consume', {
    duration, // in ms
    nbBlocks,
    consumed: Math.round(consumed / 1024 / 1024), // in MB
    speed: Math.round((consumed * 1000) / duration / 1024 / 1024), // in MB/s
  })
}
