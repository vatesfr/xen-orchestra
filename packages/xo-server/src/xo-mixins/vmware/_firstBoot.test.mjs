import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'

import { firstBootOfRepairedVm } from './_firstBoot.mjs'

const VM_REF = 'OpaqueRef:vm'

// the last report of the agent of a previous boot, dated by a host ahead of XO
const STALE_AGENT_REPORT = '20991231T00:00:00Z'

/**
 * A XAPI where the VM goes through `states`: each wait of the follow-up sees the next one, a state which does not
 * match the wait is a timeout. The guest agent reports as soon as the VM starts.
 *
 * The pool has a repair ISO, for the diagnose of a first boot which did not complete: its run is a state with
 * `output`, the values the ISO writes in xenstore.
 *
 * @param {Array<{ power_state: string, firstboot?: string, output?: Record<string, string> }>} states
 */
function fakeXapi(states) {
  const remaining = [...states]
  const calls = []
  let agentReports = 0
  const vm = {
    $ref: VM_REF,
    uuid: 'vm-uuid',
    power_state: 'Halted',
    xenstore_data: {},
    $VBDs: [],
    platform: {},
    blocked_operations: {},
    HVM_boot_params: { firmware: 'bios', order: 'c' },
    $guest_metrics: { PV_drivers_detected: true, last_updated: STALE_AGENT_REPORT },
    async update_blocked_operations() {},
    async update_HVM_boot_params() {},
  }
  const toVm = ({ power_state, firstboot, output = {} }) => ({
    ...vm,
    power_state,
    xenstore_data: {
      ...(firstboot === undefined ? {} : { 'vm-data/xo-repair/out/firstboot': firstboot }),
      ...Object.fromEntries(Object.entries(output).map(([key, value]) => [`vm-data/xo-repair/out/${key}`, value])),
    },
  })
  const iso = {
    $ref: 'OpaqueRef:iso',
    name_label: 'vates-autopilot-docking-20261112T084512Z-abcdef12.iso',
    $SR: { content_type: 'iso' },
  }
  return {
    calls,
    objects: { indexes: { type: { VDI: { [iso.$ref]: iso } } } },
    async barrier() {},
    async call(method, ...args) {
      calls.push(method)
      if (method === 'VM.start') {
        vm.power_state = 'Running'
        vm.$guest_metrics = { PV_drivers_detected: true, last_updated: `report ${++agentReports}` }
      }
    },
    async callAsync() {},
    async VBD_create() {},
    async VBD_destroy() {},
    getObject: () => vm,
    async waitObjectState(ref, predicate) {
      assert.equal(ref, VM_REF)
      const state = remaining.shift()
      if (state === undefined || !predicate(toVm(state))) {
        throw Object.assign(new Error('timeout'), { code: 'TIMEOUT' })
      }
      vm.power_state = state.power_state
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
 * A XAPI where a task is aborted when `abortOn` is called, and the guest agent has not reported since: only the
 * report of a previous boot is there, dated by a host ahead of XO.
 *
 * @param {object} params
 * @param {boolean} [params.agentReportsOnStart] - whether the agent reports when the VM starts
 */
function abortingXapi({ task, abortOn, firmware = 'bios', agentReportsOnStart = false }) {
  const calls = []
  const vm = {
    uuid: 'vm-uuid',
    power_state: 'Halted',
    HVM_boot_params: { firmware },
    $guest_metrics: { PV_drivers_detected: true, last_updated: STALE_AGENT_REPORT },
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
        if (agentReportsOnStart) {
          vm.$guest_metrics = { PV_drivers_detected: true, last_updated: 'report of the first boot' }
        }
      }
      if (method === abortOn) {
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

  await t.test('reads offline the state of a VM which stops more often than the first boot has phases', async () => {
    const report = {
      os: { kind: 'windows', firstboot: 'finish:error' },
      findings: [{ level: 'warning', code: 'windows_firstboot_incomplete', message: 'no network adapter' }],
      actions: [],
    }
    const xapi = fakeXapi([
      // stopped after the drivers phase: started again
      { power_state: 'Halted' },
      // stopped once more: the first boot did not complete
      { power_state: 'Halted' },
      // the diagnose on the repair ISO
      {
        power_state: 'Halted',
        output: { state: 'done', mode: 'diagnose', result: 'warning', version: 'dev', report: JSON.stringify(report) },
      },
      { power_state: 'Halted' },
    ])
    await assert.rejects(
      firstBootOfRepairedVm({
        xapi,
        vmRef: VM_REF,
        metadata: { vmId: '54', secureBoot: false },
        reports: WINDOWS_REPORTS,
        onProgress: async () => {},
      }),
      { code: 'FIRST_BOOT_FAILED', message: /\(finish:error: no network adapter\)/ }
    )
    // not started a third time for the first boot, only on the repair ISO
    assert.deepEqual(xapi.calls, ['VM.start', 'VM.start', 'VM.set_xenstore_data', 'VM.start', 'VM.set_xenstore_data'])
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

  await t.test('is not taken for a guest agent which did not report since the start', async () => {
    const task = new Task({ properties: { name: 'import' } })
    const xapi = abortingXapi({ task, abortOn: 'VM.start' })
    await assert.rejects(run({ task, xapi, secureBoot: false }), { name: 'AbortError' })
    assert.deepEqual(xapi.calls, ['VM.start'])
  })

  await t.test('does not wait for an agent the repair could not install', async () => {
    for (const repair of [
      { os: { kind: 'linux' }, findings: [{ level: 'info', code: 'guest_agent_missing' }], actions: [] },
      { os: { kind: 'linux' }, findings: [{ level: 'warning', code: 'guest_agent_unsupported' }], actions: [] },
      { os: { kind: 'linux' }, findings: [], actions: [{ code: 'install_guest_agent', status: 'failed' }] },
    ]) {
      const task = new Task({ properties: { name: 'import' } })
      // waiting would be aborted
      const xapi = abortingXapi({ task, abortOn: 'VM.start', firmware: 'uefi' })
      await task.run(() =>
        firstBootOfRepairedVm({
          xapi,
          vmRef: VM_REF,
          metadata: { vmId: '54', secureBoot: true },
          reports: { ...LINUX_REPORTS, repair },
          onProgress: async () => {},
        })
      )
      // nor reboots it for Secure Boot, which the agent should have confirmed
      assert.deepEqual(xapi.calls, ['VM.start'])
    }
  })

  await t.test('leaves the VM as it is while it reboots with Secure Boot', async () => {
    const task = new Task({ properties: { name: 'import' } })
    const xapi = abortingXapi({ task, abortOn: 'VM.clean_reboot', firmware: 'uefi', agentReportsOnStart: true })
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
