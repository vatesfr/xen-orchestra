import { test } from 'node:test'
import assert from 'node:assert'
import { DebugDisk } from './utils/DebugDisk.mjs'
import { SynchronizedDisk } from './SynchronizedDisk.mjs'

async function consumeGenerator(source: AsyncGenerator) {
  for await (const block of source) {
  }
  return 'finished'
}
test('Disk class', async t => {
  const testRes = await t.test('synchronised fork disk ', async () => {
    const blockSize = 1024
    const nbBlocks = 20
    const source = new DebugDisk({ nbBlocks, blockSize, fillRate: 100 })

    const disk = new SynchronizedDisk(source)
    await source.init()
    assert.strictEqual(source.getVirtualSize(), blockSize * 20, 'size should be source size')
    assert.strictEqual(source.getBlockSize(), blockSize, 'block size should be source size')
    const forks = new Array()
    for (let i = 0; i < 2; i++) {
      forks.push(disk.fork('generator_' + i))
    }
    assert.strictEqual(source.getNbGeneratedBlock(), 0, 'nothing consumed')
    await Promise.all(forks.map(fork => consumeGenerator(fork.diskBlocks())))
    await disk.close()
    assert.strictEqual(source.closeDone, true)
    assert.strictEqual(source.getNbGeneratedBlock(), nbBlocks)
  })
  console.log({ testRes })
})
