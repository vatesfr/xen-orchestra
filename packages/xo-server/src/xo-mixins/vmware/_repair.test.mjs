import assert from 'node:assert/strict'
import { test } from 'node:test'

import { diagnoseOffline } from './_repair.mjs'

const VM_REF = 'OpaqueRef:vm'
const CONTEXT = { vmId: 'vm-uuid', sourceVmId: '54' }

/**
 * A pool with a repair ISO and a VM whose start fails: the repair stops there, only what is restored matters.
 *
 * @param {object} [params]
 * @param {Set<string>} [params.failingRestores] - the restores which throw
 * @param {string} [params.firmware]
 * @param {Record<string, string>} [params.platform]
 * @param {object} [params.cdDrive] - the CD drive of the VM, none by default
 */
function fakeXapi({ failingRestores = new Set(), firmware = 'bios', platform = {}, cdDrive } = {}) {
  const calls = []
  const fail = what => {
    calls.push(what)
    if (failingRestores.has(what)) {
      throw new Error(`failed: ${what}`)
    }
  }
  const vm = {
    $ref: VM_REF,
    uuid: CONTEXT.vmId,
    $VBDs: cdDrive === undefined ? [] : [cdDrive],
    xenstore_data: {},
    platform,
    HVM_boot_params: { order: 'c', firmware },
    blocked_operations: { start: 'importing', start_on: 'importing' },
    async update_blocked_operations(operations) {
      fail(`blocked_operations=${operations.start}`)
    },
    async update_HVM_boot_params(key, value) {
      fail(`${key}=${value}`)
    },
    async update_platform(key, value) {
      fail(`platform.${key}=${value}`)
    },
  }
  const iso = { $ref: 'OpaqueRef:iso', name_label: 'xo-repair-20261112-abcdef12.iso', $SR: { content_type: 'iso' } }
  return {
    calls,
    objects: { indexes: { type: { VDI: { [iso.$ref]: iso } } } },
    getObject: () => vm,
    async VBD_create() {
      calls.push('VBD.create')
      return 'OpaqueRef:created-cd'
    },
    async VBD_destroy(ref) {
      calls.push(`VBD.destroy ${ref}`)
    },
    async callAsync(method, ref) {
      calls.push(`${method} ${ref}`)
    },
    async call(method, ref, data) {
      if (method === 'VM.set_xenstore_data') {
        // the inputs of the run are written first, the restore clears them
        return Object.keys(data).length === 0 ? fail('xenstore_data cleared') : undefined
      }
      if (method === 'VM.start') {
        throw new Error('the VM cannot start')
      }
    },
  }
}

test('withRepairIso restores how the VM boots', async t => {
  await t.test('every setting, even when one of them fails, and keeps the error of the repair', async () => {
    const xapi = fakeXapi({ failingRestores: new Set(['xenstore_data cleared']) })
    await assert.rejects(diagnoseOffline({ xapi, vmRef: VM_REF, context: CONTEXT }), {
      message: 'the VM cannot start',
    })
    assert.deepEqual(xapi.calls, [
      'VBD.create',
      'blocked_operations=null',
      'order=dc',
      'xenstore_data cleared',
      'order=c',
      'blocked_operations=importing',
      // the drive created for the ISO is removed, the VM keeps no drive the source did not have
      'VBD.destroy OpaqueRef:created-cd',
    ])
  })

  await t.test('empties the CD drive the VM already had', async () => {
    const xapi = fakeXapi({ cdDrive: { $ref: 'OpaqueRef:cd', type: 'CD', empty: true } })
    await assert.rejects(diagnoseOffline({ xapi, vmRef: VM_REF, context: CONTEXT }))
    assert.equal(xapi.calls[0], 'VBD.insert OpaqueRef:cd')
    assert.equal(xapi.calls.at(-1), 'VBD.eject OpaqueRef:cd')
  })

  await t.test('Secure Boot as it was, when the repair fails', async () => {
    // no key: the template leaves it to `auto`
    const xapi = fakeXapi({ firmware: 'uefi' })
    await assert.rejects(diagnoseOffline({ xapi, vmRef: VM_REF, context: CONTEXT }))
    const secureBootCalls = xapi.calls.filter(call => call.startsWith('platform.secureboot'))
    assert.deepEqual(secureBootCalls, ['platform.secureboot=false', 'platform.secureboot=null'])
  })
})
