import { afterEach, beforeEach, test } from 'node:test'
import assert from 'node:assert'
import { DebugDisk } from './utils/DebugDisk.mjs'
import { consume } from './utils/DebugConsumer.mjs'
import { SynchronizedDisk } from './SynchronizedDisk.mjs'

async function consumeGenerator(source: AsyncGenerator) {
  console.log('consumeGenerator', source)
  for await (const block of source) {
    console.log('consumeGenerator', { block })
  }
  return 'finished'
}
test('Disk class', async t => {
  await t.test('synchronised fork disk ', async () => {
    const blockSize = 1024
    const nbBlocks = 20
    const source = new DebugDisk({ nbBlocks, blockSize, fillRate: 100 })

    const disk = new SynchronizedDisk(source)
    await disk.init()
    assert.strictEqual(source.initDone, false, 'init should not be done by synchronized')
    await source.init()
    assert.strictEqual(source.initDone, true, 'init should be done directly on source')
    assert.strictEqual(source.getVirtualSize(), blockSize * 20, 'size should be source size')
    assert.strictEqual(source.getBlockSize(), blockSize, 'block size should be source size')
    assert.strictEqual(source.generatedDiskBlocks, 0, 'nothing consumed')
    const forks = new Array()
    for (let i = 0; i < 2; i++) {
      forks.push(disk.diskBlocks('genrator_' + i))
    }
    assert.strictEqual(source.generatedDiskBlocks, 0, 'nothing consumed')
    console.log(await Promise.all(forks.map(generator => consumeGenerator(generator))))

    await disk.close()
    assert.strictEqual(source.closeDone, true)
  })
})
