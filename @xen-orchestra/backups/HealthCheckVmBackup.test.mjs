import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Task } from '@vates/task'

import { HealthCheckVmBackup } from './HealthCheckVmBackup.mjs'

// resolves once `predicate()` is true, checked after each turn of the event loop
const waitFor = async predicate => {
  while (!predicate()) {
    await new Promise(resolve => setImmediate(resolve))
  }
}

describe('HealthCheckVmBackup#run() after an abort', () => {
  it('stops waiting for the restored VM without waiting for its timeout', async () => {
    let started = false
    const xapi = {
      callAsync: async (...args) => {
        if (args.includes('VM.start')) {
          started = true
        }
      },
      // the restored VM never reaches the expected state: only an abort can end the wait
      waitObjectState: (ref, predicate, { signal } = {}) =>
        new Promise((resolve, reject) => {
          signal?.addEventListener('abort', () => reject(signal.reason), { once: true })
        }),
    }
    const healthCheck = new HealthCheckVmBackup({
      restoredVm: { $ref: 'vm-ref', $VIFs: [], tags: [], uuid: 'vm-uuid' },
      timeout: 60e3,
      xapi,
    })

    const vmTask = new Task({ onProgress() {} })
    const result = await vmTask
      .run(async () => {
        const pRun = healthCheck.run()
        await waitFor(() => started)
        vmTask.abort()
        return Promise.race([
          pRun.then(
            () => 'resolved',
            error => error.name
          ),
          new Promise(resolve => setTimeout(resolve, 1e3, 'still waiting')),
        ])
      })
      .catch(error => error.name)

    assert.equal(result, 'AbortError')
  })
})
