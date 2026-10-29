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

  await t.test('initializing a fork initializes the source', async () => {
    const source = new DebugDisk({ nbBlocks: 20, blockSize: 1024, fillRate: 100 })
    const disk = new SynchronizedDisk(source)
    const forks = [disk.fork('generator_0'), disk.fork('generator_1')]
    assert.strictEqual(source.initDone, false, 'source is not opened before a fork is initialized')
    await forks[0].init()
    assert.strictEqual(source.initDone, true)
    assert.strictEqual(forks[0].getBlockSize(), 1024)
    await Promise.all(forks.map(fork => consumeGenerator(fork.diskBlocks())))
    assert.strictEqual(source.getNbGeneratedBlock(), 20)
  })

  await t.test('closing a fork that has never been consumed does not block the other ones', async () => {
    const source = new DebugDisk({ nbBlocks: 20, blockSize: 1024, fillRate: 100 })
    const disk = new SynchronizedDisk(source)
    const forks = [disk.fork('generator_0'), disk.fork('generator_1')]
    await forks[0].init()
    await forks[1].close()
    assert.strictEqual(await consumeGenerator(forks[0].diskBlocks()), 'finished')
    assert.strictEqual(source.getNbGeneratedBlock(), 20)
  })

  await t.test('a fork closed while its source was being opened cannot be read', async () => {
    const source = new DebugDisk({ nbBlocks: 20, blockSize: 1024, fillRate: 100 })
    const disk = new SynchronizedDisk(source)
    const [fork] = [disk.fork('generator_0')]
    const opening = fork.init()
    await fork.close()
    await opening
    await assert.rejects(consumeGenerator(fork.diskBlocks()), /closed forked disk/)
    assert.strictEqual(source.getNbGeneratedBlock(), 0)
    assert.strictEqual(source.closeDone, true, 'the source opened after the close is closed')
  })
})
