import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { Task } from '@vates/task'

import { IncrementalRemoteWriter } from './IncrementalRemoteWriter.mjs'

// only the task handling is tested: the remote operations are stubbed
class TestWriter extends IncrementalRemoteWriter {
  constructor({ failingTimestamp } = {}) {
    super({ remoteId: 'remote-id', adapter: {}, vmUuid: 'vm-uuid', job: {}, settings: {}, config: {}, schedule: {} })
    this.failingTimestamp = failingTimestamp
  }

  async _prepare() {}

  async transfer({ timestamp }) {
    await Task.run({ properties: { name: 'transfer', timestamp } }, async () => {
      if (timestamp === this.failingTimestamp) {
        throw new Error('transfer failed')
      }
    })
  }

  async cleanup() {}

  async healthCheck() {}

  async afterBackup() {}
}

/**
 * Runs `fn` in a root task, and returns the tasks created inside
 */
async function collectTasks(fn) {
  const tasksById = new Map()
  const root = new Task({
    properties: { name: 'root' },
    onProgress(event) {
      if (event.type === 'start') {
        tasksById.set(event.id, { id: event.id, parentId: event.parentId, properties: event.properties })
      } else if (event.type === 'end') {
        tasksById.get(event.id).status = event.status
      }
    },
  })
  await root.run(fn).catch(() => {})
  return [...tasksById.values()]
}

// what the mirror runner does for each restore point to transfer
async function transferRestorePoint(writer, timestamp) {
  await writer.prepare({ isFull: false })
  await writer.transfer({ timestamp })
  await writer.cleanup()
}

describe('IncrementalRemoteWriter.prepare()', () => {
  it('creates one export per restore point, each holding its own transfer', async () => {
    const tasks = await collectTasks(async () => {
      const writer = new TestWriter()
      for (const timestamp of [1, 2, 3]) {
        await transferRestorePoint(writer, timestamp)
      }
      await writer.healthCheck()
      await writer.afterBackup()
    })

    const exports = tasks.filter(task => task.properties.name === 'export')
    assert.equal(exports.length, 3)
    for (const [i, exportTask] of exports.entries()) {
      assert.equal(exportTask.status, 'success')
      const transfers = tasks.filter(task => task.parentId === exportTask.id)
      assert.deepEqual(
        transfers.map(task => task.properties.timestamp),
        [i + 1]
      )
    }
  })

  it('only fails the export of the failing restore point', async () => {
    const tasks = await collectTasks(async () => {
      const writer = new TestWriter({ failingTimestamp: 2 })
      await transferRestorePoint(writer, 1)
      await transferRestorePoint(writer, 2)
    })

    const exports = tasks.filter(task => task.properties.name === 'export')
    assert.deepEqual(
      exports.map(task => task.status),
      ['success', 'failure']
    )
  })
})
