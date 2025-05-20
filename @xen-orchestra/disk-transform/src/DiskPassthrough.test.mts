import { afterEach, beforeEach, test } from 'node:test'
import assert from 'node:assert'
import { DebugDisk } from './utils/DebugDisk.mjs'
import { DiskPassthrough } from './DiskPassthrough.mjs'
import { consume } from './utils/DebugConsumer.mjs'

test('Disk Passthrough', async t => {
  const blockSize = 1024
  const nbBlocks = 20
  let disk: DebugDisk
  beforeEach(async () => {
    disk = new DebugDisk({ nbBlocks, blockSize, fillRate: 100 })

    await disk.init()
  })
  afterEach(async () => {
    await disk.close()
  })
  await t.test('source in constructor', async () => {
    const passthrough = new DiskPassthrough(disk)
    await assert.rejects(() => passthrough.openSource())
    assert.strictEqual(passthrough.getBlockSize(), blockSize)
    assert.strictEqual(passthrough.getVirtualSize(), blockSize * nbBlocks)
    await consume(passthrough)
    assert.strictEqual(passthrough.getNbGeneratedBlock(), nbBlocks)
    assert.strictEqual(disk.closeDone, true)
  })

  await t.test('source open async', async () => {
    class DebugPT extends DiskPassthrough {
      async openSource() {
        return Promise.resolve(disk)
      }
    }
    const passthrough = new DebugPT()
    assert.throws(() => passthrough.source)
    await passthrough.init()
    assert.strictEqual(passthrough.getBlockSize(), blockSize)
    assert.strictEqual(passthrough.getVirtualSize(), blockSize * nbBlocks)
    await consume(passthrough)
    assert.strictEqual(passthrough.getNbGeneratedBlock(), nbBlocks)
    assert.strictEqual(disk.closeDone, true)
  })
})
