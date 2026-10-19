import assert from 'node:assert/strict'
import { Readable, Writable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { describe, it } from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { Task } from '@vates/task'
import { RandomAccessDisk, SynchronizedDisk } from '@xen-orchestra/disk-transform'

import { forkStreamUnpipe } from '../_forkStreamUnpipe.mjs'
import { runAndEndSourceTasks, TaskProgressHandler } from './_TaskProgressHandler.mjs'
import { watchStreamSize } from '../../_watchStreamSize.mjs'

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
        tasksById.set(event.id, { name, parentId: event.parentId, properties })
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
      }
    },
  })
  await root.run(fn)
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

describe('TaskProgressHandler.forSource()', () => {
  it('reports the sizes of a disk read by multiple writers only in the source task', async () => {
    const tasks = await collectTasks(async () => {
      const disk = new MemoryDisk()
      const progressHandler = TaskProgressHandler.forSource(
        { name: 'read disk', vdiUuid: 'vdi-uuid' },
        { size: NB_BLOCKS * BLOCK_SIZE }
      )
      disk.addProgressHandler(progressHandler)
      const synchronizedDisk = new SynchronizedDisk(disk)
      const forks = { backup: synchronizedDisk.fork('backup'), replication: synchronizedDisk.fork('replication') }

      await runAndEndSourceTasks([progressHandler], () =>
        runWriters({
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
      )
    })

    const readTask = tasks['read disk']
    assert.equal(readTask.isRootChild, true)
    assert.equal(readTask.status, 'success')
    assert.deepEqual(readTask.properties, {
      vdiUuid: 'vdi-uuid',
      size: NB_BLOCKS * BLOCK_SIZE,
      progress: 100,
      transferredSize: NB_BLOCKS * BLOCK_SIZE,
    })
    assert.deepEqual(tasks.backup.properties, {})
    assert.deepEqual(tasks.replication.properties, {})
  })

  it('reports the bytes of a forked stream of unknown length only in the source task', async () => {
    const chunks = Array.from({ length: NB_BLOCKS }, () => Buffer.alloc(BLOCK_SIZE))
    const tasks = await collectTasks(async () => {
      const stream = Readable.from(chunks)
      const progressHandler = TaskProgressHandler.forSource({ name: 'read' })
      watchStreamSize(stream, { size: 0, progressHandler })
      const forks = [forkStreamUnpipe(stream), forkStreamUnpipe(stream)]
      const sink = () =>
        new Writable({
          write(_chunk, _encoding, callback) {
            setTimeout(callback, 1)
          },
        })

      await runAndEndSourceTasks([progressHandler], () =>
        runWriters({
          remote: () => pipeline(forks[0], sink()),
          sr: () => pipeline(forks[1], sink()),
        })
      )
    })

    assert.equal(tasks.read.isRootChild, true)
    assert.equal(tasks.read.status, 'success')
    assert.equal(tasks.read.properties.transferredSize, NB_BLOCKS * BLOCK_SIZE)
    assert.equal(tasks.read.properties.size, undefined)
    assert.deepEqual(tasks.remote.properties, {})
    assert.deepEqual(tasks.sr.properties, {})
  })

  it('leaves no task when the source is never read', async () => {
    const tasks = await collectTasks(async () => {
      const progressHandler = TaskProgressHandler.forSource({ name: 'read disk' }, { size: BLOCK_SIZE })
      await assert.rejects(
        runAndEndSourceTasks([progressHandler], async () => {
          throw new Error('writer.prepare() failed')
        }),
        { message: 'writer.prepare() failed' }
      )
    })

    assert.deepEqual(Object.keys(tasks), ['root'])
  })

  it('fails the source task when the transfer fails', async () => {
    const tasks = await collectTasks(async () => {
      const progressHandler = TaskProgressHandler.forSource({ name: 'read disk' }, { size: BLOCK_SIZE })
      await assert.rejects(
        runAndEndSourceTasks([progressHandler], async () => {
          await progressHandler.setProgress(0.5)
          throw new Error('all targets have failed')
        })
      )
      // late updates of an ended task are ignored
      await progressHandler.setProgress(1)
    })

    assert.equal(tasks['read disk'].status, 'failure')
    assert.equal(tasks['read disk'].properties.progress, 50)
  })
})
