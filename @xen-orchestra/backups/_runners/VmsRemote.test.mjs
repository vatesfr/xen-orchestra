import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Task } from '@vates/task'

import { FullRemote } from './_vmRunners/FullRemote.mjs'
import { VmsRemote } from './VmsRemote.mjs'

// a VM backup that runs until the run is aborted, as a transfer does
const backupUntilAborted = () =>
  new Promise((resolve, reject) => {
    const signal = Task.abortSignal
    if (signal.aborted) {
      reject(signal.reason)
    } else {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true })
    }
  })

function createRunner({ vms, settings = {} }) {
  const sourceAdapter = {
    listAllVms: async () => vms,
    listVmBackups: async () => [{ mode: 'full', vm: {} }],
  }
  return new VmsRemote({
    config: { snapshotNameLabelTpl: '[XO Backup {job.name}] {vm.name_label}' },
    getAdapter: async remoteId => ({ value: remoteId === 'source' ? sourceAdapter : {}, dispose() {} }),
    getConnectedRecord: async () => {
      throw new Error('no record in these tests')
    },
    job: {
      id: 'job',
      mode: 'full',
      name: 'job',
      remotes: { id: { __or: ['source', 'target'] } },
      settings: { '': { concurrency: 1, ...settings } },
      sourceRemote: 'source',
    },
    schedule: { id: 'schedule' },
  })
}

// runs the runner inside a root task, aborted once the first VM backup has started
async function runAndAbort(runner, calls) {
  const events = []
  const root = new Task({ onProgress: event => events.push(event) })
  const pRun = root.run(() => runner.run())

  while ((calls.vm1 ?? 0) === 0) {
    await new Promise(resolve => setImmediate(resolve))
  }
  root.abort()
  await pRun.catch(() => {})

  return events.filter(_ => _.type === 'start' && _.properties?.type === 'VM').map(_ => _.properties.id)
}

describe('VmsRemote#run() after an abort', () => {
  it('does not start the backup of the next VMs, nor retry the aborted one', async t => {
    const calls = {}
    t.mock.method(FullRemote.prototype, 'run', function () {
      calls[this._vmUuid] = (calls[this._vmUuid] ?? 0) + 1
      return this._vmUuid === 'vm1' ? backupUntilAborted() : Promise.resolve()
    })

    const vmTaskIds = await runAndAbort(
      createRunner({ vms: ['vm1', 'vm2'], settings: { nRetriesVmBackupFailures: 2 } }),
      calls
    )

    assert.deepEqual(calls, { vm1: 1 }, 'the aborted VM is not retried and the second VM is not backed up')
    assert.deepEqual(vmTaskIds, ['vm1'], 'no task is created for the VMs not started')
  })
})
