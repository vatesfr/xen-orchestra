import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Task } from '@vates/task'

import { VmsXapi } from './VmsXapi.mjs'

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

function createRunner({ backups, settings = {} }) {
  const runner = new VmsXapi({
    config: { snapshotNameLabelTpl: '[XO Backup {job.name}] {vm.name_label}' },
    getAdapter: () => {
      throw new Error('no remote in these tests')
    },
    getConnectedRecord: async (type, id) => ({ $type: type, uuid: id, name_label: id }),
    job: {
      id: 'job',
      mode: 'full',
      name: 'job',
      settings: { '': { concurrency: 1, ...settings } },
      srs: { id: 'sr' },
      vms: { id: { __or: Object.keys(backups) } },
    },
    schedule: { id: 'schedule' },
  })

  const calls = Object.fromEntries(Object.keys(backups).map(id => [id, 0]))
  runner._getVmBackup = (mode, { vm }) => ({
    run: () => {
      ++calls[vm.uuid]
      return backups[vm.uuid]()
    },
  })

  return { runner, calls }
}

// runs the runner inside a root task, aborted once the first VM backup has started
async function runAndAbort(runner, calls) {
  const events = []
  const root = new Task({ onProgress: event => events.push(event) })
  const pRun = root.run(() => runner.run())

  while (calls.vm1 === 0) {
    await new Promise(resolve => setImmediate(resolve))
  }
  root.abort()
  await pRun.catch(() => {})

  const vmTaskIds = events.filter(_ => _.type === 'start' && _.properties?.type === 'VM').map(_ => _.properties.id)
  return { events, vmTaskIds }
}

describe('VmsXapi#run() after an abort', () => {
  it('does not start the backup of the next VMs', async () => {
    const { runner, calls } = createRunner({
      backups: { vm1: backupUntilAborted, vm2: async () => {} },
    })

    const { vmTaskIds } = await runAndAbort(runner, calls)

    assert.equal(calls.vm2, 0, 'the second VM is not backed up')
    assert.deepEqual(vmTaskIds, ['vm1'], 'no task is created for the VMs not started')
  })

  it('does not retry the aborted VM', async () => {
    const { runner, calls } = createRunner({
      backups: { vm1: backupUntilAborted },
      settings: { nRetriesVmBackupFailures: 2 },
    })

    const { events } = await runAndAbort(runner, calls)

    assert.equal(calls.vm1, 1, 'the aborted VM backup is not run again')
    const vmTaskId = events.find(_ => _.type === 'start' && _.properties?.id === 'vm1').id
    const vmEnd = events.find(_ => _.type === 'end' && _.id === vmTaskId)
    assert.equal(vmEnd.status, 'failure')
    assert.equal(vmEnd.result.name, 'AbortError')
  })
})
