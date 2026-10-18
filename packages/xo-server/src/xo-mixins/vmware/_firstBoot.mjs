import { createLogger } from '@xen-orchestra/log'
import { parseDateTime } from '@xen-orchestra/xapi'
import { setTimeout as delay } from 'node:timers/promises'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'

import { diagnoseOffline } from './_repair.mjs'
import { isFirstBootOver, readFirstBootState } from './_repairInputs.mjs'

const { warn } = createLogger('xo:mixins:vmware:first-boot')

// the drivers and the agent are installed, with a reboot in between, twice with the `full` cleanup
const WINDOWS_FIRST_BOOT_TIMEOUT = 45 * 60e3
// from the start of the VM to its guest agent reporting
const AGENT_TIMEOUT = 15 * 60e3
const AGENT_POLL_INTERVAL = 5e3

const hasFinding = (report, code) => report.findings.some(finding => finding.code === code)

/**
 * Waits for the guest agent to report, after `since`: the guest metrics of a previous boot may still be there.
 */
async function waitGuestAgent(xapi, vmRef, { since, timeout, context }) {
  const sinceSeconds = Math.floor(since / 1e3)
  const deadline = Date.now() + timeout
  while (true) {
    const guestMetrics = xapi.getObject(vmRef).$guest_metrics
    if (guestMetrics?.PV_drivers_detected && parseDateTime(guestMetrics.last_updated) >= sinceSeconds) {
      return
    }
    if (Date.now() >= deadline) {
      const error = new Error('the guest agent did not report in time')
      error.code = 'GUEST_AGENT_TIMEOUT'
      Object.assign(error, context)
      throw error
    }
    await delay(AGENT_POLL_INTERVAL, undefined, { signal: Task.abortSignal })
  }
}

async function stopVm(xapi, vmRef) {
  if (xapi.getObject(vmRef).power_state !== 'Halted') {
    await xapi.call('VM.hard_shutdown', vmRef)
  }
}

/**
 * The first-boot script of Windows can only report once the PV drivers are loaded. When it does not report
 * its end in time, or gives up, the VM is stopped and a diagnose run reads its state and log offline.
 */
async function followWindowsFirstBoot(xapi, vmRef, { context, isoVersion }) {
  let state
  try {
    const vm = await xapi.waitObjectState(
      vmRef,
      vm => isFirstBootOver(readFirstBootState(vm.xenstore_data)) || vm.power_state === 'Halted',
      { timeout: WINDOWS_FIRST_BOOT_TIMEOUT }
    )
    state = readFirstBootState(vm.xenstore_data)
  } catch (error) {
    warn('the Windows first boot did not report its end in time', { ...context, error })
  }
  if (state === 'done') {
    return
  }

  await stopVm(xapi, vmRef)
  const report = await Task.run({ properties: { name: 'reading the state of the first boot' } }, () =>
    diagnoseOffline({ xapi, vmRef, context, isoVersion })
  )
  // its message carries the end of the log of the first boot, when the report has room for it
  const incomplete = report.findings.find(finding => finding.code === 'windows_firstboot_incomplete')
  const offlineState = report.os.firstboot ?? state ?? 'no state'
  const summary = incomplete?.message === undefined ? offlineState : `${offlineState}: ${incomplete.message}`
  const error = new Error(
    `the Windows first boot did not complete (${summary}). The VM is stopped, see C:\\xo-repair\\firstboot.log in the guest`
  )
  error.code = 'FIRST_BOOT_FAILED'
  Object.assign(error, context, { state, report })
  throw error
}

/**
 * Enables Secure Boot again, as on the source, and checks that the VM still boots with it. Otherwise it is
 * disabled again: the VM must not be left unable to boot.
 */
async function enableSecureBoot(xapi, vmRef, context) {
  let readiness
  try {
    readiness = await xapi.call('VM.get_secureboot_readiness', vmRef)
  } catch (error) {
    warn('failed to read the Secure Boot readiness of the VM', { ...context, error })
  }
  if (readiness !== 'ready' && readiness !== 'ready_no_dbx') {
    Task.warning(
      `Secure Boot was enabled on the source, but the VM is not ready for it (${readiness ?? 'unknown'}): install the UEFI certificates of the pool, then enable it`
    )
    return
  }

  const vm = xapi.getObject(vmRef)
  await vm.update_platform('secureboot', 'true')
  const since = Date.now()
  try {
    await xapi.call('VM.clean_reboot', vmRef)
    await waitGuestAgent(xapi, vmRef, { since, timeout: AGENT_TIMEOUT, context })
    Task.info('Secure Boot enabled again, as on the source')
  } catch (error) {
    warn('the VM did not boot with Secure Boot, disabling it again', { ...context, error })
    await stopVm(xapi, vmRef)
    await vm.update_platform('secureboot', 'false')
    await xapi.call('VM.start', vmRef, false, false)
    Task.warning(`the VM did not boot with Secure Boot (${error.message}), it was disabled again`)
  }
}

/**
 * Starts a repaired VM and follows its first boot on XCP-ng, then enables Secure Boot again when the source
 * had it. The VM is left running, unless its first boot failed.
 *
 * @param {object} params
 * @param {import('xen-api').Xapi} params.xapi
 * @param {string} params.vmRef
 * @param {object} params.metadata - from `getTransferableVmMetadata`
 * @param {{ diagnose: object, repair: object }} params.reports - from `repairImportedVm`
 * @param {string} params.isoVersion - build of the repair ISO, to diagnose a first boot which did not complete
 */
export async function firstBootOfRepairedVm({ xapi, vmRef, metadata, reports, isoVersion }) {
  const vm = xapi.getObject(vmRef)
  const context = { vmId: vm.uuid, sourceVmId: metadata.vmId }
  const { repair } = reports
  const isWindows = repair.os.kind === 'windows'
  // older Windows: no PV drivers, the first boot cannot report anything
  const hasPvDrivers = !hasFinding(repair, 'pv_drivers_unsupported')

  const since = Date.now()
  await xapi.call('VM.start', vmRef, false, false)
  // until then the cache may still show the VM halted
  await xapi.barrier()

  const firstBootScheduled = repair.actions.some(
    action => action.code === 'install_firstboot' && action.status === 'applied'
  )
  if (isWindows && firstBootScheduled && hasPvDrivers) {
    await Task.run({ properties: { name: 'Windows first boot' } }, () =>
      followWindowsFirstBoot(xapi, vmRef, { context, isoVersion })
    )
  }

  const needsSecureBoot = vm.HVM_boot_params.firmware === 'uefi' && metadata.secureBoot
  if (!hasPvDrivers) {
    if (needsSecureBoot) {
      Task.warning('Secure Boot was enabled on the source: without guest agent, it is not enabled again automatically')
    }
    return
  }

  try {
    await waitGuestAgent(xapi, vmRef, { since, timeout: AGENT_TIMEOUT, context })
  } catch (error) {
    // the VM may run fine without its agent, e.g. a guest whose agent could not be installed
    warn('the guest agent did not report after the first boot', { ...context, error })
    Task.warning(
      `the guest agent did not report within ${AGENT_TIMEOUT / 60e3} minutes after the first boot${needsSecureBoot ? ': Secure Boot is not enabled again' : ''}`
    )
    return
  }

  if (needsSecureBoot) {
    await Task.run({ properties: { name: 'enabling Secure Boot' } }, () => enableSecureBoot(xapi, vmRef, context))
  }
}
