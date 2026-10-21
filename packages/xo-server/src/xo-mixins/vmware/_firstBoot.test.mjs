import assert from 'node:assert/strict'
import { test } from 'node:test'

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

const windowsReports = cleanup => ({
  diagnose: {},
  repair: {
    os: { kind: 'windows', cleanup },
    findings: [],
    actions: [{ code: 'install_firstboot', status: 'applied' }],
  },
})

async function followFirstBoot({ cleanup = 'standard', states }) {
  const xapi = fakeXapi(states)
  const progresses = []
  await firstBootOfRepairedVm({
    xapi,
    vmRef: VM_REF,
    metadata: { vmId: '54', secureBoot: false },
    reports: windowsReports(cleanup),
    isoVersion: '1',
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

  await t.test('restarts it after each phase of a full cleanup', async () => {
    const { calls, progresses } = await followFirstBoot({
      cleanup: 'full',
      states: [{ power_state: 'Halted' }, { power_state: 'Halted' }, { power_state: 'Running', firstboot: 'done' }],
    })
    assert.deepEqual(calls, ['VM.start', 'VM.start', 'VM.start'])
    assert.deepEqual(progresses.at(-1), { restartedAfter: ['drivers', 'cleanup'], done: true })
  })

  await t.test('follows a guest which reboots itself, as with an older ISO', async () => {
    const { calls, progresses } = await followFirstBoot({
      states: [{ power_state: 'Running', firstboot: 'done' }],
    })
    assert.deepEqual(calls, ['VM.start'])
    assert.deepEqual(progresses, [{ restartedAfter: [], done: true }])
  })

  await t.test('does not start a VM which stops more often than the first boot has phases', async () => {
    const xapi = fakeXapi([{ power_state: 'Halted' }, { power_state: 'Halted' }])
    // the diagnose of the first boot which follows needs a real pool: only what happens before it matters here
    await assert.rejects(
      firstBootOfRepairedVm({
        xapi,
        vmRef: VM_REF,
        metadata: { vmId: '54', secureBoot: false },
        reports: windowsReports('standard'),
        isoVersion: '1',
        onProgress: async () => {},
      })
    )
    assert.deepEqual(
      xapi.calls.filter(method => method === 'VM.start'),
      ['VM.start', 'VM.start']
    )
  })
})
