import { createLogger } from '@xen-orchestra/log'
import { setTimeout as delay } from 'node:timers/promises'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'

import { diagnoseOffline } from './_repair.mjs'
import {
  ACTION,
  actionStatus,
  clearRepairXenstoreData,
  FINDING,
  findFinding,
  isFirstBootOver,
  readFirstBootState,
  WINDOWS_FIRST_BOOT_LOG,
} from './_repairInputs.mjs'

const { warn } = createLogger('xo:mixins:vmware:first-boot')

// the drivers and the agent are installed, with a reboot in between
const WINDOWS_FIRST_BOOT_TIMEOUT = 45 * 60e3
// from the start of the VM to its guest agent reporting
const AGENT_TIMEOUT = 15 * 60e3
const AGENT_POLL_INTERVAL = 5e3

// the guest has no agent which could report: none was there, and the repair could not install one
const isAgentNotInstalled = repair =>
  findFinding(repair, FINDING.GUEST_AGENT_MISSING) !== undefined ||
  findFinding(repair, FINDING.GUEST_AGENT_UNSUPPORTED) !== undefined ||
  actionStatus(repair, ACTION.INSTALL_GUEST_AGENT) === 'failed'

// the phases of the first-boot script: the VM is restarted between two of them
const WINDOWS_FIRST_BOOT_PHASES = ['drivers', 'finish']

// when the guest agent last reported, as dated by the host
const lastAgentReport = (xapi, vmRef) => xapi.getObject(vmRef).$guest_metrics?.last_updated

/**
 * Waits for the guest agent to report again after `previousReport`, from `lastAgentReport`: the guest metrics of
 * a previous boot may still be there. Compared with that value and not with the clock of XO, which a host
 * ahead of it would date before the previous boot.
 */
async function waitGuestAgent(xapi, vmRef, { previousReport, timeout, context }) {
  const deadline = Date.now() + timeout
  while (true) {
    const guestMetrics = xapi.getObject(vmRef).$guest_metrics
    if (guestMetrics?.PV_drivers_detected && guestMetrics.last_updated !== previousReport) {
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
 *
 * Between two phases the script stops the VM (`windows-reboot=xo`), XO starts it again: before the PV drivers
 * are loaded the guest cannot tell anything, a stopped VM is the signal. The number of phases bounds it, a VM
 * which stops once more is a first boot which did not complete. An ISO which reboots the guest itself never
 * stops it, its first boot is followed all the same.
 *
 * @param {import('xen-api').Xapi} xapi
 * @param {string} vmRef
 * @param {object} params
 * @param {object} params.context
 * @param {(progress: import('./_repairInputs.mjs').FirstBootProgress) => Promise<void>} params.onProgress
 */
async function followWindowsFirstBoot(xapi, vmRef, { context, onProgress }) {
  const progress = { restartedAfter: [], done: false }
  const deadline = Date.now() + WINDOWS_FIRST_BOOT_TIMEOUT
  let state
  while (true) {
    let vm
    try {
      vm = await xapi.waitObjectState(
        vmRef,
        vm => isFirstBootOver(readFirstBootState(vm.xenstore_data)) || vm.power_state === 'Halted',
        { timeout: Math.max(0, deadline - Date.now()) }
      )
    } catch (error) {
      warn('the Windows first boot did not report its end in time', { ...context, error })
      break
    }
    state = readFirstBootState(vm.xenstore_data)
    if (isFirstBootOver(state) || progress.restartedAfter.length >= WINDOWS_FIRST_BOOT_PHASES.length - 1) {
      break
    }

    const phase = WINDOWS_FIRST_BOOT_PHASES[progress.restartedAfter.length]
    await Task.run({ properties: { name: `restarting the VM after the ${phase} phase of its first boot` } }, () =>
      xapi.call('VM.start', vmRef, false, false)
    )
    // until then the cache may still show the VM halted, and it would be started again
    await xapi.barrier()
    progress.restartedAfter.push(phase)
    await onProgress(progress)
  }
  if (state === 'done') {
    progress.done = true
    await onProgress(progress)
    // once described, nothing reads the state of the first boot anymore. Leaving it there fails nothing
    try {
      await xapi.call('VM.set_xenstore_data', vmRef, clearRepairXenstoreData(xapi.getObject(vmRef).xenstore_data))
    } catch (error) {
      warn('failed to clear the state of the first boot', { ...context, error })
    }
    return
  }

  await stopVm(xapi, vmRef)
  const report = await Task.run({ properties: { name: 'reading the state of the first boot' } }, () =>
    diagnoseOffline({ xapi, vmRef, context })
  )
  // its message carries the end of the log of the first boot, when the report has room for it
  const incomplete = findFinding(report, FINDING.WINDOWS_FIRSTBOOT_INCOMPLETE)
  const offlineState = report.os.firstboot ?? state ?? 'no state'
  const summary = incomplete?.message === undefined ? offlineState : `${offlineState}: ${incomplete.message}`
  const error = new Error(
    `the Windows first boot did not complete (${summary}). The VM is stopped, see ${WINDOWS_FIRST_BOOT_LOG} in the guest`
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
  try {
    await xapi.call('VM.clean_reboot', vmRef)
    // the agent of the previous boot is stopped: what the cache has once up to date is its last report
    await xapi.barrier()
    await waitGuestAgent(xapi, vmRef, {
      previousReport: lastAgentReport(xapi, vmRef),
      timeout: AGENT_TIMEOUT,
      context,
    })
    Task.info('Secure Boot enabled again, as on the source')
  } catch (error) {
    // a cancelled task is not a VM which failed to boot: it is left as it is
    if (Task.abortSignal?.aborted) {
      throw error
    }
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
 * @param {{ diagnose: object, repair: object, hasPvDrivers: boolean }} params.reports - from `repairImportedVm`
 * @param {(progress: import('./_repairInputs.mjs').FirstBootProgress) => Promise<void>} params.onProgress - called
 * each time the Windows first boot moves forward, e.g. to describe it on the VM. Must not throw
 */
export async function firstBootOfRepairedVm({ xapi, vmRef, metadata, reports, onProgress }) {
  const vm = xapi.getObject(vmRef)
  const context = { vmId: vm.uuid, sourceVmId: metadata.vmId }
  // older Windows: no PV drivers, the first boot cannot report anything. Decided by the repair, not read again
  // from its report, where the finding may have been dropped to fit in xenstore
  const { repair, hasPvDrivers } = reports
  const isWindows = repair.os.kind === 'windows'

  // the VM is halted: nothing reports until it starts
  const previousReport = lastAgentReport(xapi, vmRef)
  await xapi.call('VM.start', vmRef, false, false)
  // until then the cache may still show the VM halted
  await xapi.barrier()

  const firstBootScheduled = actionStatus(repair, ACTION.INSTALL_FIRSTBOOT) === 'applied'
  if (isWindows && firstBootScheduled && hasPvDrivers) {
    await Task.run({ properties: { name: 'Windows first boot' } }, () =>
      followWindowsFirstBoot(xapi, vmRef, { context, onProgress })
    )
  }

  const needsSecureBoot = vm.HVM_boot_params.firmware === 'uefi' && metadata.secureBoot
  if (!hasPvDrivers) {
    if (needsSecureBoot) {
      Task.warning('Secure Boot was enabled on the source: without guest agent, it is not enabled again automatically')
    }
    return
  }
  // nothing to wait for
  if (isAgentNotInstalled(repair)) {
    Task.warning(
      `the guest has no agent, which the repair could not install: install it after the first boot${needsSecureBoot ? ', then enable Secure Boot again, as on the source' : ''}`
    )
    return
  }

  try {
    await waitGuestAgent(xapi, vmRef, { previousReport, timeout: AGENT_TIMEOUT, context })
  } catch (error) {
    if (Task.abortSignal?.aborted) {
      throw error
    }
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
