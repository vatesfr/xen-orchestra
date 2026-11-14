import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'

import { diagnoseOffline, findDockingIso, dockImportedVm } from './_docking.mjs'

const VM_REF = 'OpaqueRef:vm'
const CONTEXT = { vmId: 'vm-uuid', sourceVmId: '54' }

/**
 * A pool with a docking ISO and a VM whose start fails: the docking stops there, only what is restored matters.
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
  const iso = {
    $ref: 'OpaqueRef:iso',
    name_label: 'vates-autopilot-docking-20261112T084512Z-abcdef12.iso',
    $SR: { content_type: 'iso' },
  }
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

/**
 * A task and its steps as `<name>: <status>`, in the order they end, with their warnings.
 */
function recordSteps() {
  const names = new Map()
  const steps = []
  const task = new Task({
    properties: { name: 'import' },
    onProgress: event => {
      if (event.type === 'start') {
        names.set(event.id, event.properties.name)
      } else if (event.type === 'end') {
        steps.push(`${names.get(event.id)}: ${event.status}`)
      } else if (event.type === 'warning') {
        steps.push(`warning: ${event.message}`)
      }
    },
  })
  return { task, steps }
}

test('withDockingIso traces its steps', async t => {
  await t.test('the docking ISO attached, run and released', async () => {
    const { task, steps } = recordSteps()
    const xapi = fakeXapi()
    await assert.rejects(task.run(() => diagnoseOffline({ xapi, vmRef: VM_REF, context: CONTEXT })))
    assert.deepEqual(steps, [
      'warning: no guest tools ISO in the pool: the guest agent will not be installed',
      'attaching the docking ISO: success',
      'docking ISO: diagnose: failure',
      'releasing the docking ISO: success',
      'import: failure',
    ])
  })

  await t.test('warns when the docking ISO could not be released', async () => {
    const { task, steps } = recordSteps()
    const xapi = fakeXapi()
    xapi.VBD_destroy = async () => {
      throw new Error('still attached')
    }
    await assert.rejects(task.run(() => diagnoseOffline({ xapi, vmRef: VM_REF, context: CONTEXT })))
    assert.deepEqual(steps.slice(-3), [
      'warning: the docking ISO could not be released: still attached',
      'releasing the docking ISO: success',
      'import: failure',
    ])
  })
})

test('withDockingIso restores how the VM boots', async t => {
  await t.test('every setting, even when one of them fails, and keeps the error of the docking', async () => {
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

  await t.test('releases the disks of the docking before returning', async () => {
    // the VM is started right after: a disk still being released stays attached to the running VM
    const xapi = fakeXapi()
    xapi.VBD_destroy = async ref => {
      await new Promise(resolve => setTimeout(resolve, 10))
      xapi.calls.push(`VBD.destroy ${ref}`)
    }
    await assert.rejects(diagnoseOffline({ xapi, vmRef: VM_REF, context: CONTEXT }))
    assert.equal(xapi.calls.at(-1), 'VBD.destroy OpaqueRef:created-cd')
  })

  await t.test('Secure Boot as it was, when the docking fails', async () => {
    // no key: the template leaves it to `auto`
    const xapi = fakeXapi({ firmware: 'uefi' })
    await assert.rejects(diagnoseOffline({ xapi, vmRef: VM_REF, context: CONTEXT }))
    const secureBootCalls = xapi.calls.filter(call => call.startsWith('platform.secureboot'))
    assert.deepEqual(secureBootCalls, ['platform.secureboot=false', 'platform.secureboot=null'])
  })
})

test('findDockingIso', async t => {
  const poolWith = (...names) => ({
    objects: {
      indexes: {
        type: {
          VDI: Object.fromEntries(
            names.map(name => [name, { $ref: name, name_label: name, $SR: { content_type: 'iso' } }])
          ),
        },
      },
    },
  })

  await t.test('takes the most recent build, release or not', async () => {
    const xapi = poolWith(
      'vates-autopilot-docking-20261113T084512Z-abcdef12.iso',
      'vates-autopilot-docking-20261113T091030Z-1.2.0.iso',
      'vates-autopilot-docking-20261101T120000Z-12345678-dirty.iso'
    )
    assert.equal(findDockingIso(xapi, CONTEXT).name_label, 'vates-autopilot-docking-20261113T091030Z-1.2.0.iso')
  })

  await t.test('ignores a name it could not order', async () => {
    // would come last by name, before any dated build
    const xapi = poolWith('vates-autopilot-docking-20261112T084512Z-abcdef12.iso', 'vates-autopilot-docking-latest.iso')
    assert.equal(findDockingIso(xapi, CONTEXT).name_label, 'vates-autopilot-docking-20261112T084512Z-abcdef12.iso')
    assert.throws(() => findDockingIso(poolWith('vates-autopilot-docking-latest.iso'), CONTEXT), {
      code: 'DOCKING_ISO_NOT_FOUND',
    })
  })
})

const INPUT_KEYS = ['mode', 'nics', 'windows-nics', 'windows-reboot']
const METADATA = { vmId: '54', networks: [], guestNics: [] }

const reportOf = ({ kind = 'linux', findings = [], actions = [], ...os } = {}) => ({
  os: { kind, ...os },
  network: [],
  findings,
  actions,
})
const blockedOn = (code, data) => reportOf({ findings: [{ level: 'error', code, data }] })

/**
 * A pool where each boot of the VM on the docking ISO is the next of `runs`: the outputs of the ISO
 * (`{ result, report }`), `'timeout'` for an ISO which never reports, `'no result'` for one which halts the VM
 * without a result.
 *
 * @param {object} params
 * @param {Array<{ result: string, report: object } | 'timeout' | 'no result'>} params.runs
 * @param {Array<{ name: string, userdevice: string }>} [params.disks]
 */
function isoXapi({ runs, disks = [] }) {
  const remainingRuns = [...runs]
  const calls = []
  // the inputs of each boot on the ISO
  const inputs = []
  let currentRun
  const vm = {
    $ref: VM_REF,
    uuid: CONTEXT.vmId,
    power_state: 'Halted',
    xenstore_data: {},
    platform: {},
    blocked_operations: {},
    HVM_boot_params: { order: 'c', firmware: 'bios' },
    $VBDs: disks.map(({ name, userdevice }) => ({
      type: 'Disk',
      userdevice,
      async set_userdevice(value) {
        calls.push(`${name}.userdevice=${value}`)
        this.userdevice = value
      },
      async set_bootable(value) {
        calls.push(`${name}.bootable=${value}`)
      },
    })),
    async update_blocked_operations() {},
    async update_HVM_boot_params() {},
    async update_platform(key, value) {
      calls.push(`platform.${key}=${value}`)
    },
  }
  const iso = {
    $ref: 'OpaqueRef:iso',
    name_label: 'vates-autopilot-docking-20261112T084512Z-abcdef12.iso',
    $SR: { content_type: 'iso' },
  }
  return {
    calls,
    inputs,
    objects: { indexes: { type: { VDI: { [iso.$ref]: iso } } } },
    getObject: () => vm,
    async barrier() {},
    async VBD_create() {},
    async VBD_destroy() {},
    async callAsync() {},
    async call(method, ref, arg) {
      if (method === 'VM.set_xenstore_data') {
        vm.xenstore_data = arg
      } else if (method === 'VM.get_allowed_VBD_devices') {
        return ['5', '6']
      } else if (method === 'VM.start') {
        inputs.push(
          Object.fromEntries(
            INPUT_KEYS.flatMap(key => {
              const value = vm.xenstore_data[`vm-data/xo-docking/${key}`]
              return value === undefined ? [] : [[key, value]]
            })
          )
        )
        currentRun = remainingRuns.shift()
        assert.notEqual(currentRun, undefined, 'booted on the ISO more often than expected')
        if (typeof currentRun === 'object') {
          const { mode } = inputs.at(-1)
          const outputs = { state: 'done', mode, version: 'dev', result: currentRun.result }
          outputs.report = JSON.stringify(currentRun.report)
          for (const [key, value] of Object.entries(outputs)) {
            vm.xenstore_data[`vm-data/xo-docking/out/${key}`] = value
          }
        }
        if (currentRun !== 'timeout') {
          vm.power_state = 'Halted'
        }
      } else {
        calls.push(method)
      }
    },
    async waitObjectState(ref, predicate) {
      if (currentRun !== 'timeout' && predicate(vm)) {
        return vm
      }
      throw Object.assign(new Error('timeout'), { code: 'TIMEOUT' })
    },
  }
}

const dock = (xapi, options) => dockImportedVm({ xapi, vmRef: VM_REF, metadata: METADATA, ...options })

test('dockImportedVm', async t => {
  await t.test('runs a diagnose, then a dock', async () => {
    const xapi = isoXapi({
      runs: [
        { result: 'ok', report: reportOf() },
        { result: 'ok', report: reportOf({ actions: [{ code: 'install_xen_drivers', status: 'applied' }] }) },
      ],
    })
    const reports = await dock(xapi)
    assert.deepEqual(xapi.inputs, [{ mode: 'diagnose' }, { mode: 'dock' }])
    assert.equal(reports.dock.actions[0].code, 'install_xen_drivers')
    assert.equal(reports.hasPvDrivers, true)
    assert.equal(reports.windowsReboot, undefined)
  })

  await t.test('moves the OS disk first, then diagnoses again', async () => {
    const xapi = isoXapi({
      disks: [
        { name: 'xvda', userdevice: '0' },
        { name: 'xvdb', userdevice: '1' },
      ],
      runs: [
        { result: 'error', report: blockedOn('boot_disk_not_first', { os_disk: 'xvdb' }) },
        { result: 'ok', report: reportOf() },
        { result: 'ok', report: reportOf() },
      ],
    })
    await dock(xapi)
    // the first disk is parked on a free userdevice: they are unique
    assert.deepEqual(xapi.calls, [
      'xvda.userdevice=5',
      'xvda.bootable=false',
      'xvdb.userdevice=0',
      'xvdb.bootable=true',
      'xvda.userdevice=1',
    ])
    assert.deepEqual(
      xapi.inputs.map(({ mode }) => mode),
      ['diagnose', 'diagnose', 'dock']
    )
  })

  await t.test('stops before any change on a blocking finding', async () => {
    const xapi = isoXapi({ runs: [{ result: 'error', report: blockedOn('ntfs_unclean') }] })
    await assert.rejects(dock(xapi), error => {
      assert.equal(error.code, 'DOCKING_BLOCKED')
      assert.equal(error.reports.diagnose.findings[0].code, 'ntfs_unclean')
      return true
    })
    assert.deepEqual(xapi.inputs, [{ mode: 'diagnose' }])
  })

  await t.test('stops when the OS disk is not known', async () => {
    // not a disk of the VM
    let xapi = isoXapi({
      disks: [{ name: 'xvda', userdevice: '0' }],
      runs: [{ result: 'error', report: blockedOn('boot_disk_not_first', { os_disk: 'xvdc' }) }],
    })
    await assert.rejects(dock(xapi), { code: 'DOCKING_OS_DISK_NOT_FOUND', osDisk: 'xvdc' })
    assert.deepEqual(xapi.calls, [])

    // dropped from a report too large for xenstore
    xapi = isoXapi({ runs: [{ result: 'error', report: blockedOn('boot_disk_not_first') }] })
    await assert.rejects(dock(xapi), { code: 'DOCKING_BLOCKED' })
  })

  await t.test('fails with both reports when the docking fails', async () => {
    const xapi = isoXapi({
      runs: [
        { result: 'ok', report: reportOf() },
        {
          result: 'error',
          report: reportOf({ actions: [{ code: 'rebuild_initramfs', status: 'failed', error: 'dracut failed' }] }),
        },
      ],
    })
    await assert.rejects(dock(xapi), error => {
      assert.equal(error.code, 'DOCKING_FAILED')
      assert.match(error.message, /rebuild_initramfs: dracut failed\. Full report and logs in \/var\/log\/xo-docking\//)
      assert.ok(error.reports.diagnose !== undefined && error.reports.dock !== undefined)
      return true
    })
  })

  await t.test('leaves the reboots of Windows to XO when it follows the first boot', async () => {
    const xapi = isoXapi({
      runs: [
        { result: 'ok', report: reportOf({ kind: 'windows', rtc_timeoffset: 3600 }) },
        { result: 'ok', report: reportOf({ kind: 'windows' }) },
      ],
    })
    const reports = await dock(xapi, { followFirstBoot: true })
    assert.equal(xapi.inputs[1]['windows-reboot'], 'xo')
    // what the first boot and the description of the VM rely on
    assert.equal(reports.windowsReboot, 'xo')
    assert.equal(reports.hasPvDrivers, true)
    // Windows keeps the RTC in local time
    assert.deepEqual(xapi.calls, ['platform.timeoffset=3600'])
  })

  await t.test('leaves the reboots to a Windows without PV drivers', async () => {
    const tooOld = reportOf({ kind: 'windows', findings: [{ level: 'warning', code: 'pv_drivers_unsupported' }] })
    const xapi = isoXapi({
      runs: [
        { result: 'warning', report: tooOld },
        { result: 'warning', report: tooOld },
      ],
    })
    const reports = await dock(xapi, { followFirstBoot: true })
    // XO could not tell when its first boot ends
    assert.equal(xapi.inputs[1]['windows-reboot'], 'guest')
    assert.equal(reports.windowsReboot, 'guest')
    assert.equal(reports.hasPvDrivers, false)
  })

  await t.test('stops the VM when the ISO does not report in time', async () => {
    const xapi = isoXapi({ runs: ['timeout'] })
    await assert.rejects(dock(xapi), { code: 'DOCKING_ISO_TIMEOUT' })
    assert.deepEqual(xapi.calls, ['VM.hard_shutdown'])
  })

  await t.test('fails when the ISO halts the VM without a result', async () => {
    const xapi = isoXapi({ runs: ['no result'] })
    await assert.rejects(dock(xapi), { code: 'DOCKING_ISO_NO_RESULT', mode: 'diagnose' })
  })
})
