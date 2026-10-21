import { test } from 'node:test'
import assert from 'node:assert'
import { DebugDisk } from './utils/DebugDisk.mjs'
import { MeteredDisk, ReadMeter } from './MeteredDisk.mjs'
import { SynchronizedDisk } from './SynchronizedDisk.mjs'
import { DiskBlock } from './Disk.mjs'

const blockSize = 1024
const nbBlocks = 20

function createMeter() {
  const meter = {
    readSize: 0,
    bytesToRead: [] as number[],
    ends: [] as Array<{ isComplete: boolean; error?: unknown }>,
    onStart({ bytesToRead }: { bytesToRead: number }) {
      meter.bytesToRead.push(bytesToRead)
    },
    onRead(length: number) {
      meter.readSize += length
    },
    onEnd(result: { isComplete: boolean; error?: unknown }) {
      meter.ends.push(result)
    },
  } satisfies ReadMeter & Record<string, unknown>
  return meter
}

async function createDisk() {
  const disk = new DebugDisk({ nbBlocks, blockSize, fillRate: 100 })
  await disk.init()
  return disk
}

test('MeteredDisk', async t => {
  await t.test('reports the bytes read and the completion', async () => {
    const disk = await createDisk()
    const meter = createMeter()
    const metered = new MeteredDisk(disk, meter)
    for await (const block of metered.diskBlocks()) {
      assert.strictEqual(block.data.length, blockSize)
    }
    assert.deepStrictEqual(meter.bytesToRead, [nbBlocks * blockSize])
    assert.strictEqual(meter.readSize, nbBlocks * blockSize)
    assert.deepStrictEqual(meter.ends, [{ isComplete: true, error: undefined }])
    assert.strictEqual(disk.closeDone, true)
  })

  await t.test('reports an early stop of the consumer as incomplete', async () => {
    const meter = createMeter()
    const metered = new MeteredDisk(await createDisk(), meter)
    let nbRead = 0
    for await (const block of metered.diskBlocks()) {
      assert.strictEqual(block.data.length, blockSize)
      if (++nbRead === 3) {
        break
      }
    }
    assert.strictEqual(meter.readSize, 3 * blockSize)
    assert.deepStrictEqual(meter.ends, [{ isComplete: false, error: undefined }])
  })

  await t.test('reports the error of the source', async () => {
    const disk = await createDisk()
    const error = new Error('read failed')
    disk.readBlock = async (index: number): Promise<DiskBlock> => {
      if (index === 5) {
        throw error
      }
      return { index, data: Buffer.alloc(blockSize) }
    }
    const meter = createMeter()
    const metered = new MeteredDisk(disk, meter)
    await assert.rejects(async () => {
      for await (const block of metered.diskBlocks()) {
        assert.strictEqual(block.data.length, blockSize)
      }
    }, error)
    assert.strictEqual(meter.readSize, 5 * blockSize)
    assert.deepStrictEqual(meter.ends, [{ isComplete: false, error }])
  })

  await t.test('counts a source read once by multiple forks', async () => {
    const meter = createMeter()
    const synchronized = new SynchronizedDisk(new MeteredDisk(await createDisk(), meter))
    const forks = [synchronized.fork('first'), synchronized.fork('second')]
    await Promise.all(
      forks.map(async fork => {
        for await (const block of fork.diskBlocks()) {
          assert.strictEqual(block.data.length, blockSize)
          await new Promise(resolve => setTimeout(resolve, Math.random() * 3))
        }
      })
    )
    assert.strictEqual(meter.readSize, nbBlocks * blockSize)
    assert.deepStrictEqual(meter.ends, [{ isComplete: true, error: undefined }])
  })

  await t.test('reports the size of the blocks present in the source', async () => {
    const disk = new DebugDisk({ nbBlocks, blockSize, fillRate: 50 })
    await disk.init()
    const meter = createMeter()
    for await (const block of new MeteredDisk(disk, meter).diskBlocks()) {
      assert.strictEqual(block.data.length, blockSize)
    }
    assert.deepStrictEqual(meter.bytesToRead, [disk.getBlockIndexesCount() * blockSize])
    assert.strictEqual(meter.readSize, disk.getBlockIndexesCount() * blockSize)
  })

  await t.test('does not start on a source without blocks', async () => {
    const disk = new DebugDisk({ nbBlocks, blockSize, fillRate: 0 })
    await disk.init()
    const meter = createMeter()
    for await (const block of new MeteredDisk(disk, meter).diskBlocks()) {
      assert.strictEqual(block.data.length, blockSize)
    }
    assert.deepStrictEqual(meter.bytesToRead, [])
    assert.deepStrictEqual(meter.ends, [{ isComplete: true, error: undefined }])
  })
})
