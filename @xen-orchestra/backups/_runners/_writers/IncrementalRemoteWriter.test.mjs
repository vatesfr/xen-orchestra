import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Task } from '@vates/task'

import { IncrementalRemoteWriter } from './IncrementalRemoteWriter.mjs'

// a writer on a fake remote, whose transfer fails as an aborted transfer does
function createWriter({ config = { disableMergeWorker: true }, handler } = {}) {
  const calls = { cleanVm: 0, cleanVmOptions: [], lockDisposed: false }
  const writer = new IncrementalRemoteWriter({
    adapter: {
      handler: {
        ...handler,
        mktree: async () => {},
        lock: async () => ({
          dispose: async () => {
            calls.lockDisposed = true
          },
        }),
      },
      cleanVm: async (vmDir, options) => {
        ++calls.cleanVm
        calls.cleanVmOptions.push(options)
        return {}
      },
    },
    config,
    job: { id: 'job', mode: 'delta' },
    remoteId: 'remote',
    schedule: { id: 'schedule' },
    settings: {},
    vmUuid: 'vm',
  })

  // what `prepare()` wraps in its "export" task
  writer._prepare = async () => {}
  writer.transfer = () =>
    new Promise((resolve, reject) => {
      const signal = Task.abortSignal
      if (signal.aborted) {
        reject(signal.reason)
      } else {
        signal.addEventListener('abort', () => reject(signal.reason), { once: true })
      }
    })

  return { calls, writer }
}

// the steps of a VM backup for this writer, in the order `_AbstractXapi#run()` calls them
async function runSteps(writer, { abort }) {
  const events = []
  const vmTask = new Task({ skipSubtasksAfterAbort: true, onProgress: event => events.push(event) })
  let afterBackupError

  await vmTask
    .run(async () => {
      await writer.beforeBackup()
      try {
        await writer.prepare({ isFull: true })
        const pTransfer = writer.transfer()
        abort(vmTask)
        await pTransfer
      } finally {
        // `$defer` of `_AbstractXapi#run()`
        await writer.afterBackup().catch(error => {
          afterBackupError = error
        })
      }
    })
    .catch(() => {})

  return { afterBackupError, events }
}

describe('IncrementalRemoteWriter#afterBackup()', () => {
  it('cleans the VM directory and releases the lock after a failed transfer', async () => {
    const { calls, writer } = createWriter()

    const { afterBackupError } = await runSteps(writer, {
      // a transfer that fails for another reason than an abort
      abort: vmTask => setImmediate(() => vmTask._abortController.abort(new Error('target unreachable'))),
    })

    assert.equal(afterBackupError, undefined)
    assert.equal(calls.cleanVm, 2, 'clean-vm runs before and after the backup')
    assert.equal(calls.lockDisposed, true)
  })

  it('cleans the VM directory and releases the lock after an abort, in a clean-vm subtask', async () => {
    const { calls, writer } = createWriter()

    const { afterBackupError, events } = await runSteps(writer, {
      abort: vmTask => setImmediate(() => vmTask.abort()),
    })

    assert.equal(afterBackupError, undefined)
    assert.equal(calls.cleanVm, 2, 'clean-vm runs before and after the backup')
    assert.equal(calls.lockDisposed, true)

    const cleanVmIds = events.filter(_ => _.type === 'start' && _.properties?.name === 'clean-vm').map(_ => _.id)
    assert.equal(cleanVmIds.length, 2)
    const lastCleanVmEnd = events.find(_ => _.type === 'end' && _.id === cleanVmIds[1])
    assert.equal(lastCleanVmEnd.status, 'success')
  })

  it('releases the lock when the clean-vm after the backup fails', async () => {
    const { calls, writer } = createWriter()
    writer.transfer = async () => {}
    const cleanVm = writer._cleanVm
    writer._cleanVm = function (options) {
      return options.cleanup ? Promise.reject(new Error('clean-vm failed')) : cleanVm.call(this, options)
    }

    const { afterBackupError } = await runSteps(writer, { abort: () => {} })

    assert.equal(afterBackupError?.message, 'clean-vm failed')
    assert.equal(calls.lockDisposed, true)
  })
})

describe('IncrementalRemoteWriter clean-vm and abort', () => {
  it('merges before and after the backup when it is not aborted', async () => {
    const { calls, writer } = createWriter()

    writer.transfer = async () => {}
    await runSteps(writer, { abort: () => {} })

    assert.deepEqual(
      calls.cleanVmOptions.map(_ => _.merge),
      [true, true]
    )
  })

  it('still merges in the cleanup made after an abort, which is not stopped (level 1)', async () => {
    const { calls, writer } = createWriter()

    await runSteps(writer, { abort: vmTask => setImmediate(() => vmTask.abort()) })

    assert.deepEqual(
      calls.cleanVmOptions.map(_ => _.merge),
      [true, true]
    )
  })

  it('aborts the clean-vm made before the transfer with the backup', async () => {
    const { calls, writer } = createWriter()
    const vmTask = new Task({ skipSubtasksAfterAbort: true, onProgress() {} })
    let signal
    writer._adapter.cleanVm = async () => {
      signal = Task.abortSignal
      vmTask.abort()
      ++calls.cleanVm
      return {}
    }

    await vmTask.run(() => writer.beforeBackup())

    assert.equal(signal.aborted, true)
  })
})

describe('IncrementalRemoteWriter#transfer() after an abort', () => {
  it('stops writing the disks and writes no metadata', async () => {
    const writes = []
    let metadataWritten = false
    const vmTask = new Task({ skipSubtasksAfterAbort: true, onProgress() {} })
    const writer = new IncrementalRemoteWriter({
      adapter: {
        getVhdFileName: basename => `${basename}.vhd`,
        handler: { readFile: async () => Promise.reject(new Error('no such file')) },
        listVmBackups: async () => [],
        writeVhd: async (path, disk, { signal }) => {
          if (signal?.aborted) {
            throw signal.reason
          }
          writes.push(path)
          // the backup is aborted once the first disk has been written
          vmTask.abort()
          return 1
        },
        writeVmBackupMetadata: async () => {
          metadataWritten = true
        },
      },
      config: {},
      job: { id: 'job', mode: 'delta' },
      remoteId: 'remote',
      schedule: { id: 'schedule' },
      settings: { diskPerVmConcurrency: 1 },
      vmUuid: 'vm',
    })
    const disk = { close: async () => {} }
    const deltaExport = {
      disks: { vdi1: disk, vdi2: disk },
      vbds: {},
      vdis: { vdi1: { uuid: 'uuid1', $snapshot_of$uuid: 'src1' }, vdi2: { uuid: 'uuid2', $snapshot_of$uuid: 'src2' } },
      vifs: {},
      vm: { uuid: 'vm' },
      vtpms: {},
    }

    await vmTask
      .run(() =>
        writer.transfer({
          deltaExport,
          isVhdDifferencing: { vdi1: false, vdi2: false },
          timestamp: 0,
          vm: { uuid: 'vm' },
          vmSnapshot: {},
        })
      )
      .catch(() => {})

    assert.equal(writes.length, 1, 'the second disk is not written')
    assert.equal(metadataWritten, false, 'no metadata is written for an aborted backup')
  })
})

describe('IncrementalRemoteWriter clean-vm and the skip of the cleanup', () => {
  it('does not stop the clean-vm made before the transfer for a level 1 abort, but for a skipped cleanup', async () => {
    const { writer } = createWriter()
    const vmTask = new Task({ onProgress() {} })
    const states = []
    writer._adapter.cleanVm = async (vmDir, options) => {
      assert.ok(options.signal instanceof AbortSignal)
      // level 1: the merge goes on, the clean after the transfer would resume it anyway
      vmTask.abort()
      states.push(options.signal.aborted)
      // level 2
      vmTask.abortCleanup()
      states.push(options.signal.aborted)
      return {}
    }

    await vmTask.run(() => writer.beforeBackup())

    assert.deepEqual(states, [false, true])
  })

  it('gives cleanVm() of afterBackup() the cleanup signal, not the abort', async () => {
    const { writer } = createWriter()
    const vmTask = new Task({ onProgress() {} })
    const states = []
    writer._adapter.cleanVm = async (vmDir, options) => {
      assert.ok(options.signal instanceof AbortSignal)
      states.push(options.signal.aborted)
      return {}
    }

    await vmTask.run(async () => {
      await writer.beforeBackup()
      // level 1
      vmTask.abort()
      await writer.afterBackup()
    })

    // not aborted by the abort alone, before or after the transfer
    assert.deepEqual(states, [false, false])
  })

  it('stops the clean of afterBackup() when the cleanup is skipped, and still releases the lock', async () => {
    const { calls, writer } = createWriter()
    const vmTask = new Task({ onProgress() {} })
    let received
    let afterBackupError
    writer._adapter.cleanVm = async (vmDir, { signal }) => {
      received = signal
      // the user skips the cleanup while it runs
      vmTask.abortCleanup()
      signal.throwIfAborted()
      return {}
    }

    await vmTask.run(async () => {
      vmTask.abort()
      // the lock taken by beforeBackup() is the one afterBackup() releases
      await writer.beforeBackup()
      calls.cleanVm = 0
      await writer.afterBackup().catch(error => (afterBackupError = error))
    })

    assert.equal(received?.aborted, true, 'the clean was stopped by the skip of the cleanup')
    assert.equal(afterBackupError, undefined, 'afterBackup() does not fail: the clean error is logged')
    assert.equal(calls.lockDisposed, true, 'the remote lock is released')
  })

  it('does not queue the merge worker when the clean completes after the skip of the cleanup', async () => {
    let queued = false
    const { calls, writer } = createWriter({
      config: { disableMergeWorker: false },
      handler: {
        getRealPath: () => '/remote',
        outputFile: async () => {
          queued = true
          // never reaches MergeWorker.run()
          throw new Error('the merge worker is queued')
        },
      },
    })
    const vmTask = new Task({ onProgress() {} })
    let afterBackupError

    await vmTask.run(async () => {
      await writer.beforeBackup()
      vmTask.abort()
      writer._adapter.cleanVm = async () => {
        // skipped once the clean is past its last stop point: it completes, with merges left to the worker
        vmTask.abortCleanup()
        return { merge: true }
      }
      await writer.afterBackup().catch(error => (afterBackupError = error))
    })

    assert.equal(queued, false)
    assert.equal(afterBackupError, undefined)
    assert.equal(calls.lockDisposed, true)
  })

  it('does not abort the clean of afterBackup() for a second level 1 abort', async () => {
    const { writer } = createWriter()
    const vmTask = new Task({ onProgress() {} })
    let signal
    writer._adapter.cleanVm = async (vmDir, options) => {
      signal = options.signal
      // aborting again, without skipping the cleanup, must not stop the clean
      vmTask.abort()
      return {}
    }

    await vmTask.run(async () => {
      await writer.beforeBackup()
      await writer.afterBackup()
    })

    assert.equal(signal.aborted, false)
  })
})
