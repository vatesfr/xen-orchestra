import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'

import { firstBootOfRepairedVm } from './_firstBoot.mjs'

const VM_REF = 'OpaqueRef:vm'

/**
 * A XAPI where the VM goes through `states`: each wait of the follow-up sees the next one, a state which does not
 * match the wait is a timeout.
 *
 * @param {Array<{ power_state: string, firstboot?: string }>} states
 */
function fakeXapi(states) {
  const remaining = [...states]
  const calls = []
  const vm = {
    uuid: 'vm-uuid',
    power_state: 'Halted',
    xenstore_data: {},
    HVM_boot_params: { firmware: 'bios' },
    // the agent of the last boot, as soon as the VM runs
    $guest_metrics: { PV_drivers_detected: true, last_updated: Math.floor(Date.now() / 1e3) + 3600 },
  }
  const toVm = ({ power_state, firstboot }) => ({
    ...vm,
    power_state,
    xenstore_data: firstboot === undefined ? {} : { 'vm-data/xo-repair/out/firstboot': firstboot },
  })
  return {
    calls,
    async barrier() {},
    async call(method, ...args) {
      calls.push(method)
      if (method === 'VM.start') {
        vm.power_state = 'Running'
      }
    },
    getObject: () => vm,
    async waitObjectState(ref, predicate) {
      assert.equal(ref, VM_REF)
      const state = remaining.shift()
      if (state === undefined || !predicate(toVm(state))) {
        throw Object.assign(new Error('timeout'), { code: 'TIMEOUT' })
      }
      return toVm(state)
    },
  }
}

const WINDOWS_REPORTS = {
  diagnose: {},
  repair: {
    os: { kind: 'windows' },
    findings: [],
    actions: [{ code: 'install_firstboot', status: 'applied' }],
  },
  hasPvDrivers: true,
}

const LINUX_REPORTS = {
  diagnose: {},
  repair: { os: { kind: 'linux' }, findings: [], actions: [] },
  hasPvDrivers: true,
}

/**
 * A XAPI where a task is aborted when `abortOn` is called, and the guest agent has not reported since.
 */
function abortingXapi({ task, abortOn, firmware = 'bios' }) {
  const calls = []
  const vm = {
    uuid: 'vm-uuid',
    power_state: 'Halted',
    HVM_boot_params: { firmware },
    $guest_metrics: { PV_drivers_detected: true, last_updated: Math.floor(Date.now() / 1e3) + 3600 },
    async update_platform(key, value) {
      calls.push(`platform.${key}=${value}`)
    },
  }
  return {
    calls,
    async barrier() {},
    getObject: () => vm,
    async call(method) {
      calls.push(method)
      if (method === 'VM.start') {
        vm.power_state = 'Running'
      }
      if (method === abortOn) {
        vm.$guest_metrics = undefined
        task.abort(new Error('cancelled by the user'))
      }
      if (method === 'VM.get_secureboot_readiness') {
        return 'ready'
      }
    },
  }
}

async function followFirstBoot({ states }) {
  const xapi = fakeXapi(states)
  const progresses = []
  await firstBootOfRepairedVm({
    xapi,
    vmRef: VM_REF,
    metadata: { vmId: '54', secureBoot: false },
    reports: WINDOWS_REPORTS,
    onProgress: async progress => {
      progresses.push(structuredClone(progress))
    },
  })
  return { calls: xapi.calls, progresses }
}

test('firstBootOfRepairedVm, Windows', async t => {
  await t.test('starts the VM again when the first boot stops it between two phases', async () => {
    const { calls, progresses } = await followFirstBoot({
      states: [{ power_state: 'Halted' }, { power_state: 'Running', firstboot: 'done' }],
    })
    assert.deepEqual(calls, ['VM.start', 'VM.start'])
    assert.deepEqual(progresses, [
      { restartedAfter: ['drivers'], done: false },
      { restartedAfter: ['drivers'], done: true },
    ])
  })

  await t.test('follows a guest which reboots itself, as with an older ISO', async () => {
    const { calls, progresses } = await followFirstBoot({
      states: [{ power_state: 'Running', firstboot: 'done' }],
    })
    assert.deepEqual(calls, ['VM.start'])
    assert.deepEqual(progresses, [{ restartedAfter: [], done: true }])
  })

  await t.test('does not follow a guest without PV drivers, even when the report lost the finding', async () => {
    // `pv_drivers_unsupported` dropped from a report too large for xenstore: the decision of the repair prevails
    const xapi = fakeXapi([])
    await firstBootOfRepairedVm({
      xapi,
      vmRef: VM_REF,
      metadata: { vmId: '54', secureBoot: false },
      reports: { ...WINDOWS_REPORTS, hasPvDrivers: false },
      onProgress: async () => {},
    })
    assert.deepEqual(xapi.calls, ['VM.start'])
  })

  await t.test('does not start a VM which stops more often than the first boot has phases', async () => {
    const xapi = fakeXapi([{ power_state: 'Halted' }, { power_state: 'Halted' }])
    // the diagnose of the first boot which follows needs a real pool: only what happens before it matters here
    await assert.rejects(
      firstBootOfRepairedVm({
        xapi,
        vmRef: VM_REF,
        metadata: { vmId: '54', secureBoot: false },
        reports: WINDOWS_REPORTS,
        onProgress: async () => {},
      })
    )
    assert.deepEqual(
      xapi.calls.filter(method => method === 'VM.start'),
      ['VM.start', 'VM.start']
    )
  })
})

test('firstBootOfRepairedVm, abort', async t => {
  const run = ({ task, xapi, secureBoot }) =>
    task.run(() =>
      firstBootOfRepairedVm({
        xapi,
        vmRef: VM_REF,
        metadata: { vmId: '54', secureBoot },
        reports: LINUX_REPORTS,
        onProgress: async () => {},
      })
    )

  await t.test('is not taken for a guest agent which did not report', async () => {
    const task = new Task({ properties: { name: 'import' } })
    const xapi = abortingXapi({ task, abortOn: 'VM.start' })
    await assert.rejects(run({ task, xapi, secureBoot: false }), { name: 'AbortError' })
    assert.deepEqual(xapi.calls, ['VM.start'])
  })

  await t.test('leaves the VM as it is while it reboots with Secure Boot', async () => {
    const task = new Task({ properties: { name: 'import' } })
    const xapi = abortingXapi({ task, abortOn: 'VM.clean_reboot', firmware: 'uefi' })
    await assert.rejects(run({ task, xapi, secureBoot: true }), { name: 'AbortError' })
    // neither stopped, nor Secure Boot disabled again
    assert.deepEqual(xapi.calls, [
      'VM.start',
      'VM.get_secureboot_readiness',
      'platform.secureboot=true',
      'VM.clean_reboot',
    ])
  })
})
