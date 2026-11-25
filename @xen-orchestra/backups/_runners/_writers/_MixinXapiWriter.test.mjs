import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Task } from '@vates/task'

import { FullXapiWriter } from './FullXapiWriter.mjs'

describe('MixinXapiWriter#healthCheck() after an abort', () => {
  it('passes the abort signal to the copy of the replica', async () => {
    const vmTask = new Task({ skipSubtasksAfterAbort: true, onProgress() {} })
    const calls = []
    const xapi = {
      getObject: ref => ({ $ref: ref, $xapi: xapi, name_label: 'replica' }),
      VM_getDisks: async () => [],
      callAsync: async (...args) => {
        calls.push(args)
        // the backup is aborted while the replica is being copied
        vmTask.abort()
        throw new Error('stop after the copy call')
      },
    }
    const writer = new FullXapiWriter({
      config: {},
      healthCheckSr: { $ref: 'OpaqueRef:health-check-sr', uuid: 'health-check-sr' },
      job: { id: 'job' },
      schedule: { id: 'schedule' },
      settings: { healthCheckTimeout: '10m' },
      sr: { $xapi: xapi, name_label: 'sr', uuid: 'sr' },
      vmUuid: 'vm',
    })
    writer._targetVmRef = 'OpaqueRef:replica'
    // the replica is not on the health check SR: it is copied there
    xapi.VM_getDisks = async () => ['OpaqueRef:vdi']
    xapi.getObject = ref =>
      ref === 'OpaqueRef:vdi' ? { $SR: { uuid: 'sr' } } : { $ref: ref, $xapi: xapi, name_label: 'replica' }

    await vmTask.run(() => assert.rejects(writer.healthCheck(), /stop after the copy call/)).catch(() => {})

    const [[signal, method]] = calls
    assert.ok(signal instanceof AbortSignal, 'the copy gets a signal')
    assert.equal(signal.aborted, true, 'the copy gets the abort signal of the backup')
    assert.equal(method, 'VM.copy')
  })
})
