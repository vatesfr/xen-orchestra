import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Task } from '@vates/task'

import { AggregatedFullXapiWriter } from './AggregatedFullXapiWriter.mjs'

function createWriter(settings = {}) {
  const writer = new AggregatedFullXapiWriter({ srs: [{}], ReplicationWriter: class {}, settings })
  const calls = { deleteOldReplicas: 0 }
  writer.deleteOldReplicas = async () => {
    ++calls.deleteOldReplicas
  }
  return { calls, writer }
}

describe('AggregatedFullXapiWriter#afterBackup()', () => {
  it('deletes the old replicas', async () => {
    const { calls, writer } = createWriter()

    await new Task({ onProgress() {} }).run(() => writer.afterBackup())

    assert.equal(calls.deleteOldReplicas, 1)
  })

  it('does not delete the old replicas once the cleanup is skipped', async () => {
    const { calls, writer } = createWriter()
    const vmTask = new Task({ onProgress() {} })

    await vmTask.run(() => {
      vmTask.abort()
      vmTask.abortCleanup()
      return writer.afterBackup()
    })

    assert.equal(calls.deleteOldReplicas, 0)
  })
})
