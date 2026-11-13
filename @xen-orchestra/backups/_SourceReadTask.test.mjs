import assert from 'node:assert/strict'
import { Readable, Writable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { describe, it, mock } from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { Task } from '@vates/task'
import { MeteredDisk, RandomAccessDisk, SynchronizedDisk } from '@xen-orchestra/disk-transform'

import { forkStreamUnpipe } from './_runners/_forkStreamUnpipe.mjs'
import { meterDisk, SourceReadTask } from './_SourceReadTask.mjs'
import { watchStreamSize } from './_watchStreamSize.mjs'

const BLOCK_SIZE = 1024
const NB_BLOCKS = 20

class MemoryDisk extends RandomAccessDisk {
  getVirtualSize() {
    return NB_BLOCKS * BLOCK_SIZE
  }
  getBlockSize() {
    return BLOCK_SIZE
  }
  async init() {}
  async close() {}
  isDifferencing() {
    return false
  }
  getBlockIndexes() {
    return Array.from({ length: NB_BLOCKS }, (_, index) => index)
  }
  hasBlock() {
    return true
  }
  async readBlock(index) {
    return { index, data: Buffer.alloc(BLOCK_SIZE) }
  }
}

/**
 * Runs `fn` in a root task, and returns the tasks created inside, by name
 */
async function collectTasks(fn) {
  const tasksById = new Map()
  const root = new Task({
    properties: { name: 'root' },
    onProgress(event) {
      if (event.type === 'start') {
        const { name, ...properties } = event.properties
        tasksById.set(event.id, { id: event.id, name, parentId: event.parentId, properties, speeds: [] })
        return
      }
      const task = tasksById.get(event.id)
      if (task === undefined) {
        return
      }
      if (event.type === 'property') {
        task.properties[event.name] = event.value
        if (event.name === 'speed') {
          task.speeds.push(event.value)
        }
      } else if (event.type === 'end') {
        task.status = event.status
        task.result = event.result
      }
    },
  })
  await root.run(fn).catch(() => {})
  const tasksByName = {}
  for (const task of tasksById.values()) {
    task.isRootChild = task.parentId === root.id
    tasksByName[task.name] = task
  }
  return tasksByName
}

// each writer consumes its fork at its own pace, in its own task
function runWriters(consumers) {
  return Promise.all(Object.entries(consumers).map(([name, consume]) => Task.run({ properties: { name } }, consume)))
}

function createMeteredDisk() {
  return new MeteredDisk(new MemoryDisk(), new SourceReadTask('read disk'))
}

describe('SourceReadTask', () => {
  it('reports the current speed, at most every 5 seconds', async () => {
    mock.timers.enable({ apis: ['Date'], now: 0 })
    try {
      const tasks = await collectTasks(async () => {
        const readTask = new SourceReadTask('read')
        readTask.onRead(1e3)
        mock.timers.tick(2e3)
        readTask.onRead(1e3) // throttled
        mock.timers.tick(3e3)
        readTask.onRead(3e3)
        mock.timers.tick(10e3)
        readTask.onRead(10e3)
        readTask.onEnd()
      })

      assert.deepEqual(tasks.read.speeds, [1e3, 1e3])
      assert.equal(tasks.read.status, 'success')
    } finally {
      mock.timers.reset()
    }
  })

  it('reports a disk read by multiple writers only in its own task', async () => {
    const tasks = await collectTasks(async () => {
      const synchronizedDisk = new SynchronizedDisk(createMeteredDisk())
      const forks = { backup: synchronizedDisk.fork('backup'), replication: synchronizedDisk.fork('replication') }

      await runWriters({
        async backup() {
          for await (const block of forks.backup.diskBlocks()) {
            assert.equal(block.data.length, BLOCK_SIZE)
            await delay(1)
          }
        },
        async replication() {
          for await (const block of forks.replication.diskBlocks()) {
            assert.equal(block.data.length, BLOCK_SIZE)
            await delay(Math.random() * 3)
          }
        },
      })
    })

    const readTask = tasks['read disk']
    assert.equal(readTask.isRootChild, true)
    assert.equal(readTask.status, 'success')
    assert.deepEqual(tasks.backup.properties, {})
    assert.deepEqual(tasks.replication.properties, {})
  })

  it('reports a forked stream only in its own task', async () => {
    const chunks = Array.from({ length: NB_BLOCKS }, () => Buffer.alloc(BLOCK_SIZE))
    const tasks = await collectTasks(async () => {
      const stream = Readable.from(chunks)
      watchStreamSize(stream, { size: 0, readTask: new SourceReadTask('read') })
      const forks = [forkStreamUnpipe(stream), forkStreamUnpipe(stream)]
      const sink = () =>
        new Writable({
          write(_chunk, _encoding, callback) {
            setTimeout(callback, 1)
          },
        })

      await runWriters({
        remote: () => pipeline(forks[0], sink()),
        sr: () => pipeline(forks[1], sink()),
      })
    })

    assert.equal(tasks.read.isRootChild, true)
    assert.equal(tasks.read.status, 'success')
    assert.deepEqual(tasks.remote.properties, {})
    assert.deepEqual(tasks.sr.properties, {})
  })

  it('leaves no task when the source is never read', async () => {
    const tasks = await collectTasks(async () => {
      createMeteredDisk()
    })

    assert.deepEqual(Object.keys(tasks), ['root'])
  })

  it('succeeds when its consumers stop early', async () => {
    const tasks = await collectTasks(async () => {
      let nbRead = 0
      for await (const block of createMeteredDisk().diskBlocks()) {
        assert.equal(block.data.length, BLOCK_SIZE)
        if (++nbRead === 5) {
          break
        }
      }
    })

    assert.equal(tasks['read disk'].status, 'success')
  })

  it('fails when the source fails', async () => {
    const tasks = await collectTasks(async () => {
      const disk = new MemoryDisk()
      disk.readBlock = async index => {
        if (index === 2) {
          throw new Error('NBD connection lost')
        }
        return { index, data: Buffer.alloc(BLOCK_SIZE) }
      }
      const meteredDisk = new MeteredDisk(disk, new SourceReadTask('read disk'))
      await assert.rejects(async () => {
        for await (const block of meteredDisk.diskBlocks()) {
          assert.equal(block.data.length, BLOCK_SIZE)
        }
      })
    })

    assert.equal(tasks['read disk'].status, 'failure')
    assert.equal(tasks['read disk'].result.message, 'NBD connection lost')
  })

  it('names the task of a disk after its VDI', async () => {
    const tasks = await collectTasks(async () => {
      const disk = meterDisk(new MemoryDisk(), { name_label: 'system' })
      for await (const block of disk.diskBlocks()) {
        assert.equal(block.data.length, BLOCK_SIZE)
      }
    })

    assert.equal(tasks['read disk system'].isRootChild, true)
    assert.equal(tasks['read disk system'].status, 'success')
  })
})
