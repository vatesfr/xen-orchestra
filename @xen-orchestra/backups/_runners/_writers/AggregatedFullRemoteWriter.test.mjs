import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Task } from '@vates/task'

import { AggregatedFullRemoteWriter } from './AggregatedFullRemoteWriter.mjs'

function createWriter(settings = {}) {
  const writer = new AggregatedFullRemoteWriter({ adapters: { remote: {} }, BackupWriter: class {}, settings })
  const calls = { deleteOldBackups: 0 }
  writer.deleteOldBackups = async () => {
    ++calls.deleteOldBackups
  }
  return { calls, writer }
}

describe('AggregatedFullRemoteWriter#afterBackup()', () => {
  it('deletes the old backups', async () => {
    const { calls, writer } = createWriter()

    await new Task({ onProgress() {} }).run(() => writer.afterBackup())

    assert.equal(calls.deleteOldBackups, 1)
  })

  it('does not delete the old backups once the cleanup is skipped', async () => {
    const { calls, writer } = createWriter()
    const vmTask = new Task({ onProgress() {} })

    await vmTask.run(() => {
      vmTask.abort()
      vmTask.abortCleanup()
      return writer.afterBackup()
    })

    assert.equal(calls.deleteOldBackups, 0)
  })
})
