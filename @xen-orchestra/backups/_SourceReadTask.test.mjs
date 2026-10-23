import assert from 'node:assert/strict'
import { Readable, Writable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { describe, it } from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { Task } from '@vates/task'
import { MeteredDisk, RandomAccessDisk, SynchronizedDisk } from '@xen-orchestra/disk-transform'

import { forkStreamUnpipe } from './_runners/_forkStreamUnpipe.mjs'
import { meterIncrementalExport, SourceReadTask } from './_SourceReadTask.mjs'
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
        tasksById.set(event.id, { id: event.id, name, parentId: event.parentId, properties })
        return
      }
      const task = tasksById.get(event.id)
      if (task === undefined) {
        return
      }
      if (event.type === 'property') {
        task.properties[event.name] = event.value
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

function createMeteredDisk(diskProperties = { name: 'read disk', vdiUuid: 'vdi-uuid' }) {
  return new MeteredDisk(new MemoryDisk(), new SourceReadTask(diskProperties))
}

describe('SourceReadTask', () => {
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
    assert.deepEqual(readTask.result, { isComplete: true })
    assert.deepEqual(Object.keys(readTask.properties).sort(), ['metrics', 'progress', 'vdiUuid'])
    assert.equal(readTask.properties.vdiUuid, 'vdi-uuid')
    assert.equal(readTask.properties.progress, 100)
    const { bytesRead } = readTask.properties.metrics
    assert.equal(bytesRead.value, NB_BLOCKS * BLOCK_SIZE)
    assert.equal(bytesRead.total, NB_BLOCKS * BLOCK_SIZE)
    // the final value is always in the history
    assert.equal(bytesRead.history.at(-1)[1], NB_BLOCKS * BLOCK_SIZE)
    assert.deepEqual(tasks.backup.properties, {})
    assert.deepEqual(tasks.replication.properties, {})
  })

  it('reports a forked stream of unknown length only in its own task', async () => {
    const chunks = Array.from({ length: NB_BLOCKS }, () => Buffer.alloc(BLOCK_SIZE))
    const tasks = await collectTasks(async () => {
      const stream = Readable.from(chunks)
      watchStreamSize(stream, { size: 0, readTask: new SourceReadTask({ name: 'read' }) })
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
    assert.deepEqual(tasks.read.result, { isComplete: true })
    assert.equal(tasks.read.properties.metrics.bytesRead.value, NB_BLOCKS * BLOCK_SIZE)
    assert.equal(tasks.read.properties.metrics.bytesRead.total, undefined)
    assert.equal(tasks.read.properties.progress, undefined)
  })

  it('leaves no task when the source is never read', async () => {
    const tasks = await collectTasks(async () => {
      createMeteredDisk()
    })

    assert.deepEqual(Object.keys(tasks), ['root'])
  })

  it('succeeds as incomplete when its consumers stop early', async () => {
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
    assert.deepEqual(tasks['read disk'].result, { isComplete: false })
    assert.equal(tasks['read disk'].properties.metrics.bytesRead.value, 5 * BLOCK_SIZE)
    assert.equal(tasks['read disk'].properties.progress, 25)
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
      const meteredDisk = new MeteredDisk(disk, new SourceReadTask({ name: 'read disk' }))
      await assert.rejects(async () => {
        for await (const block of meteredDisk.diskBlocks()) {
          assert.equal(block.data.length, BLOCK_SIZE)
        }
      })
    })

    assert.equal(tasks['read disk'].status, 'failure')
    assert.equal(tasks['read disk'].result.message, 'NBD connection lost')
    assert.equal(tasks['read disk'].properties.metrics.bytesRead.value, 2 * BLOCK_SIZE)
  })

  it('reports each disk of an incremental export in its own task', async () => {
    const tasks = await collectTasks(async () => {
      const incrementalExport = {
        disks: { 'OpaqueRef:1': new MemoryDisk(), 'OpaqueRef:2': new MemoryDisk() },
        vdis: {
          'OpaqueRef:1': { name_label: 'system', uuid: 'vdi-1' },
          'OpaqueRef:2': { name_label: 'data', uuid: 'vdi-2' },
        },
      }
      meterIncrementalExport(incrementalExport)
      for (const disk of Object.values(incrementalExport.disks)) {
        assert.ok(disk instanceof MeteredDisk)
        for await (const block of disk.diskBlocks()) {
          assert.equal(block.data.length, BLOCK_SIZE)
        }
      }
    })

    for (const [name, vdiUuid] of [
      ['read disk system', 'vdi-1'],
      ['read disk data', 'vdi-2'],
    ]) {
      assert.equal(tasks[name].isRootChild, true)
      assert.equal(tasks[name].status, 'success')
      assert.equal(tasks[name].properties.vdiUuid, vdiUuid)
      assert.equal(tasks[name].properties.metrics.bytesRead.value, NB_BLOCKS * BLOCK_SIZE)
    }
  })

  it('groups the reads of a restore point in the task it is metered in', async () => {
    const tasks = await collectTasks(async () => {
      const incrementalExport = {
        disks: { 'OpaqueRef:1': new MemoryDisk() },
        vdis: { 'OpaqueRef:1': { name_label: 'system', uuid: 'vdi-1' } },
      }
      const readTask = new Task({ properties: { name: 'read', timestamp: 1 } })
      await readTask.runInside(() => meterIncrementalExport(incrementalExport))
      for await (const block of incrementalExport.disks['OpaqueRef:1'].diskBlocks()) {
        assert.equal(block.data.length, BLOCK_SIZE)
      }
      readTask.success()
    })

    assert.equal(tasks.read.isRootChild, true)
    assert.equal(tasks.read.status, 'success')
    assert.equal(tasks['read disk system'].isRootChild, false)
    assert.equal(tasks['read disk system'].parentId, tasks.read.id)
    assert.equal(tasks['read disk system'].status, 'success')
  })
})
