import Disposable from 'promise-toolbox/Disposable'
import { createLogger } from '@xen-orchestra/log'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'

import {
  buildLinuxNics,
  buildDockingXenstoreData,
  buildWindowsNics,
  clearDockingXenstoreData,
  describeAction,
  describeFailures,
  describeFinding,
  describeOs,
  FINDING,
  findFinding,
  getBlockingFindings,
  guestLogsOf,
  isDockingIsoName,
  isDockingDone,
  readDockingOutput,
  userdeviceOfXvd,
} from './_dockingInputs.mjs'

const { warn } = createLogger('xo:mixins:vmware:docking')

// rebuilding the initramfs of every kernel of a large guest takes a few minutes, a boot on the ISO
// which does not report anything by then will not
const RUN_TIMEOUT = 30 * 60e3
// the ISO powers the VM off right after writing `done`
const POWER_OFF_TIMEOUT = 5 * 60e3
// `xenstore_data` may be synced after the halt is seen
const OUTPUT_SYNC_TIMEOUT = 30e3

// the guest tools disk: a disk and not a CD, xen-blkfront ignores the CD drives of an HVM guest. Far from
// the disks of the VM when it is free, the ISO recognizes the disk by its content anyway
const TOOLS_USERDEVICE = '25'

/**
 * The most recent docking ISO deployed on the pool as an ISO SR VDI: its name starts with the date and time of its
 * build, `vates-autopilot-docking-<YYYYMMDDTHHMMSSZ>-<commit or version>.iso`, the last one by name is the most
 * recent. A name without that structure is ignored: it could not be ordered.
 */
export function findDockingIso(xapi, context) {
  const isos = Object.values(xapi.objects.indexes.type.VDI ?? {}).filter(
    vdi => isDockingIsoName(vdi.name_label) && !vdi.missing && vdi.$SR?.content_type === 'iso'
  )
  if (isos.length === 0) {
    const error = new Error(
      'no docking ISO vates-autopilot-docking-<YYYYMMDDTHHMMSSZ>-<commit or version>.iso in the pool'
    )
    error.code = 'DOCKING_ISO_NOT_FOUND'
    Object.assign(error, context)
    throw error
  }
  return isos.reduce((latest, vdi) => (vdi.name_label > latest.name_label ? vdi : latest))
}

const findToolsIso = xapi =>
  Object.values(xapi.objects.indexes.type.VDI ?? {}).find(vdi => vdi.is_tools_iso && !vdi.missing)

/**
 * The CD drive of the VM, created when it has none: then it is destroyed on release, not only emptied.
 *
 * @returns {Promise<{ cdDriveRef: string, isCreated: boolean }>}
 */
async function insertCd(xapi, vm, iso) {
  const cdDrive = vm.$VBDs.find(vbd => vbd.type === 'CD')
  if (cdDrive === undefined) {
    const cdDriveRef = await xapi.VBD_create({ type: 'CD', VM: vm.$ref, VDI: iso.$ref, bootable: true })
    return { cdDriveRef, isCreated: true }
  }
  if (!cdDrive.empty) {
    await xapi.callAsync('VBD.eject', cdDrive.$ref)
  }
  await xapi.callAsync('VBD.insert', cdDrive.$ref, iso.$ref)
  return { cdDriveRef: cdDrive.$ref, isCreated: false }
}

/**
 * The docking ISO in the CD drive and the guest tools ISO as a read-only disk, both released on dispose:
 * neither SR supports snapshots.
 */
async function attachDockingDisks(xapi, vmRef, context) {
  const { cdDriveRef, isCreated, toolsVbdRef } = await Task.run(
    { properties: { name: 'attaching the docking ISO' } },
    async () => {
      const iso = findDockingIso(xapi, context)
      Task.info(`docking ISO: ${iso.name_label}`)
      const vm = xapi.getObject(vmRef)

      const { cdDriveRef, isCreated } = await insertCd(xapi, vm, iso)

      // optional: without it the ISO does everything but install the guest agent
      const toolsIso = findToolsIso(xapi)
      let toolsVbdRef
      if (toolsIso === undefined) {
        Task.warning('no guest tools ISO in the pool: the guest agent will not be installed')
      } else {
        try {
          const allowedUserdevices = await xapi.call('VM.get_allowed_VBD_devices', vmRef)
          toolsVbdRef = await xapi.VBD_create({
            bootable: false,
            mode: 'RO',
            type: 'Disk',
            userdevice: allowedUserdevices.includes(TOOLS_USERDEVICE) ? TOOLS_USERDEVICE : allowedUserdevices.at(-1),
            VDI: toolsIso.$ref,
            VM: vmRef,
          })
        } catch (error) {
          warn('failed to attach the guest tools ISO', { ...context, error })
          Task.warning(`the guest tools ISO could not be attached: ${error.message}`)
        }
      }
      return { cdDriveRef, isCreated, toolsVbdRef }
    }
  )

  return new Disposable(() =>
    Task.run({ properties: { name: 'releasing the docking ISO' } }, async () => {
      // the VM is imported anyway: failing to release these is not worth failing it
      await (isCreated ? xapi.VBD_destroy(cdDriveRef) : xapi.callAsync('VBD.eject', cdDriveRef)).catch(error => {
        warn('failed to release the docking ISO', { ...context, error })
        Task.warning(`the docking ISO could not be released: ${error.message}`)
      })
      if (toolsVbdRef !== undefined) {
        await xapi.VBD_destroy(toolsVbdRef).catch(error => {
          warn('failed to detach the guest tools ISO', { ...context, error })
          Task.warning(`the guest tools ISO could not be detached: ${error.message}`)
        })
      }
    })
  )
}

/**
 * What a run of the ISO found and did, in its task. A diagnose is a plan, nothing in it is a warning of the
 * import yet.
 *
 * @param {import('./_dockingInputs.mjs').DockingOutput} output
 */
function traceReport({ mode, report }) {
  const isPlan = mode === 'diagnose'
  const os = describeOs(report)
  if (os !== undefined) {
    Task.info(os)
  }
  for (const action of report.actions) {
    const message = `action ${describeAction(action)}`
    if (action.status === 'failed') {
      Task.warning(message)
    } else {
      Task.info(message)
    }
  }
  for (const finding of report.findings) {
    // a failed action is already in the actions
    if (finding.code === FINDING.ACTION_FAILED) {
      continue
    }
    const message = `finding ${describeFinding(finding)}`
    if (isPlan || finding.level === 'info') {
      Task.info(message)
    } else {
      Task.warning(message)
    }
  }
  if (report.truncated) {
    Task.info('details were dropped from the report to fit in xenstore')
  }
}

/**
 * Boots the VM on the ISO and waits for its result.
 *
 * @returns {Promise<import('./_dockingInputs.mjs').DockingOutput>}
 */
function runDockingIso(xapi, vmRef, inputs, context) {
  return Task.run({ properties: { name: `docking ISO: ${inputs.mode}` } }, async () => {
    await xapi.call(
      'VM.set_xenstore_data',
      vmRef,
      buildDockingXenstoreData(xapi.getObject(vmRef).xenstore_data, inputs)
    )
    await xapi.call('VM.start', vmRef, false, false)
    // until then the cache may still show the VM halted, or the `done` of the previous run
    await xapi.barrier()

    let vm
    try {
      vm = await xapi.waitObjectState(vmRef, vm => isDockingDone(vm.xenstore_data) || vm.power_state === 'Halted', {
        timeout: RUN_TIMEOUT,
      })
    } catch (cause) {
      await xapi
        .call('VM.hard_shutdown', vmRef)
        .catch(error => warn('failed to stop the VM after the docking ISO timed out', { ...context, error }))
      // most likely the firmware refused the ISO, which then never started
      const error = new Error('the docking ISO did not report its result in time')
      error.code = 'DOCKING_ISO_TIMEOUT'
      error.cause = cause
      Object.assign(error, context)
      throw error
    }

    if (!isDockingDone(vm.xenstore_data)) {
      vm = await xapi
        .waitObjectState(vmRef, vm => isDockingDone(vm.xenstore_data), { timeout: OUTPUT_SYNC_TIMEOUT })
        .catch(cause => {
          const error = new Error('the VM halted without a result from the docking ISO')
          error.code = 'DOCKING_ISO_NO_RESULT'
          error.cause = cause
          Object.assign(error, context, { mode: inputs.mode })
          throw error
        })
    }
    const output = readDockingOutput(vm.xenstore_data, context)

    await xapi
      .waitObjectState(vmRef, vm => vm.power_state === 'Halted', { timeout: POWER_OFF_TIMEOUT })
      .catch(async error => {
        warn('the docking ISO did not power the VM off, forcing it', { ...context, error })
        await xapi.call('VM.hard_shutdown', vmRef)
      })

    if (output.report === undefined) {
      const error = new Error('the docking ISO reported no report')
      error.code = 'DOCKING_ISO_NO_RESULT'
      Object.assign(error, context, { mode: inputs.mode })
      throw error
    }
    Task.info(`docking ISO ${output.version}: ${output.mode} ${output.result}`)
    traceReport(output)
    return output
  })
}

/**
 * XCP-ng boots the first disk: the VBD of the OS disk takes userdevice 0, the disk which had it takes
 * the former userdevice of the OS disk.
 */
async function moveDiskFirst(xapi, vmRef, osDisk, context) {
  const vbds = xapi.getObject(vmRef).$VBDs.filter(vbd => vbd.type === 'Disk')
  const userdevice = userdeviceOfXvd(osDisk)
  const osVbd = vbds.find(vbd => vbd.userdevice === userdevice)
  if (osVbd === undefined) {
    const error = new Error(`the OS is on ${osDisk}, which is not a disk of the VM`)
    error.code = 'DOCKING_OS_DISK_NOT_FOUND'
    Object.assign(error, context, { osDisk })
    throw error
  }
  const firstVbd = vbds.find(vbd => vbd.userdevice === '0')
  await Task.run({ properties: { name: `moving the OS disk ${osDisk} first` } }, async () => {
    if (firstVbd !== undefined) {
      // userdevices are unique: park the first disk on a free one
      const [freeUserdevice] = await xapi.call('VM.get_allowed_VBD_devices', vmRef)
      await firstVbd.set_userdevice(freeUserdevice)
      await firstVbd.set_bootable(false)
    }
    await osVbd.set_userdevice('0')
    await osVbd.set_bootable(true)
    if (firstVbd !== undefined) {
      await firstVbd.set_userdevice(userdevice)
    }
  })
}

const isBlockedOnBootDisk = report =>
  getBlockingFindings(report).some(finding => finding.code === FINDING.BOOT_DISK_NOT_FIRST)

function assertNotBlocked(report, context) {
  if (getBlockingFindings(report).length !== 0) {
    const error = new Error(`the guest cannot be docked: ${describeFailures(report).join('; ')}`)
    error.code = 'DOCKING_BLOCKED'
    Object.assign(error, context, { reports: { diagnose: report } })
    throw error
  }
}

/**
 * Runs `fn` with the VM booting on the docking ISO, then restores how it boots on its disks. `fn` is given a
 * function which boots the VM on the ISO with these inputs, and returns its outputs.
 *
 * Secure Boot stays disabled: the ISO is not signed, and it is enabled again only once the guest has
 * booted on XCP-ng. When `fn` fails, the guest is not booted by XO: it is restored as it was.
 */
async function withDockingIso(xapi, vmRef, context, fn) {
  const vm = xapi.getObject(vmRef)
  const { order } = vm.HVM_boot_params
  const { start, start_on } = vm.blocked_operations
  const isUefi = vm.HVM_boot_params.firmware === 'uefi'
  const { secureboot } = vm.platform

  const run = inputs => runDockingIso(xapi, vmRef, inputs, context)

  // not `Disposable.use(disposable, fn)`: it does not wait for an asynchronous dispose, and the VM is started
  // right after, with the disks still being released
  const dockingDisks = await attachDockingDisks(xapi, vmRef, context)
  try {
    try {
      await vm.update_blocked_operations({ start: null, start_on: null })
      await vm.update_HVM_boot_params('order', 'dc')
      if (isUefi) {
        // an absent key means `auto`, which enforces Secure Boot when the pool has certificates
        await vm.update_platform('secureboot', 'false')
      }
      return await fn(run)
    } catch (error) {
      if (isUefi) {
        await xapi
          .getObject(vmRef)
          .update_platform('secureboot', secureboot ?? null)
          .catch(restoreError => warn('failed to restore Secure Boot', { ...context, error: restoreError }))
      }
      throw error
    } finally {
      // each one on its own: a failed restore must neither skip the others nor replace the error of the docking
      const current = xapi.getObject(vmRef)
      const restores = {
        'the docking inputs and outputs': () =>
          xapi.call('VM.set_xenstore_data', vmRef, clearDockingXenstoreData(current.xenstore_data)),
        'the boot order': () => current.update_HVM_boot_params('order', order),
        'the blocked operations': () =>
          current.update_blocked_operations({ start: start ?? null, start_on: start_on ?? null }),
      }
      for (const [what, restore] of Object.entries(restores)) {
        try {
          await restore()
        } catch (error) {
          warn(`failed to restore ${what} after the docking ISO`, { ...context, error })
        }
      }
    }
  } finally {
    await dockingDisks.dispose()
  }
}

/**
 * A diagnose run on a halted VM, e.g. to read the state of a Windows first boot which could not report it.
 *
 * @returns {Promise<import('./_dockingInputs.mjs').DockingReport>}
 */
export async function diagnoseOffline({ xapi, vmRef, context }) {
  const { report } = await withDockingIso(xapi, vmRef, context, run => run({ mode: 'diagnose' }))
  return report
}

/**
 * Prepares an imported VM to boot on XCP-ng with the docking ISO: a diagnose run, which modifies nothing,
 * then a dock run. The VM must be halted, and is left halted, booting on its disks.
 *
 * @param {object} params
 * @param {import('xen-api').Xapi} params.xapi
 * @param {string} params.vmRef
 * @param {object} params.metadata - from `getTransferableVmMetadata`
 * @param {boolean} [params.followFirstBoot] - whether XO starts the VM and follows its first boot: the
 * Windows first boot then leaves its reboots to XO
 * @returns {Promise<{ diagnose: object, dock: object, hasPvDrivers: boolean, windowsReboot?: string }>} the
 * reports of both runs, whether the guest got the PV drivers, and who restarts Windows between the phases of its
 * first boot: the first boot must follow the same decisions as the ISO
 */
export async function dockImportedVm({ xapi, vmRef, metadata, followFirstBoot = false }) {
  const vm = xapi.getObject(vmRef)
  const context = { vmId: vm.uuid, sourceVmId: metadata.vmId }

  return withDockingIso(xapi, vmRef, context, async run => {
    let diagnose = await run({ mode: 'diagnose' })
    if (isBlockedOnBootDisk(diagnose.report)) {
      const osDisk = findFinding(diagnose.report, FINDING.BOOT_DISK_NOT_FIRST).data?.os_disk
      if (osDisk === undefined) {
        // the details of the findings are dropped from a report too large for xenstore
        assertNotBlocked(diagnose.report, context)
      }
      await moveDiskFirst(xapi, vmRef, osDisk, context)
      diagnose = await run({ mode: 'diagnose' })
    }
    assertNotBlocked(diagnose.report, context)
    Task.abortSignal?.throwIfAborted()

    const isWindows = diagnose.report.os.kind === 'windows'
    if (isWindows && metadata.networks.length > 1 && metadata.guestNics.length === 0) {
      // the cards are matched with the old adapters by the addresses the VMware tools reported
      Task.warning(
        'the source did not report its network cards (not running, or without VMware tools): static addresses of a VM with several cards cannot be carried over'
      )
    }
    const hasPvDrivers = findFinding(diagnose.report, FINDING.PV_DRIVERS_UNSUPPORTED) === undefined
    if (!hasPvDrivers) {
      Task.warning(
        'this Windows version is older than the XCP-ng PV drivers support (build 14393): the VM will run on emulated devices, without management agent'
      )
    }
    // without PV drivers the first boot cannot report its end: XO does not follow it, and a VM stopped
    // between two phases would stay stopped
    const windowsReboot = isWindows ? (followFirstBoot && hasPvDrivers ? 'xo' : 'guest') : undefined
    const dock = await run(
      isWindows
        ? {
            mode: 'dock',
            windowsNics: buildWindowsNics({
              guestNics: metadata.guestNics,
              networks: metadata.networks,
              reportNetwork: diagnose.report.network,
            }),
            windowsReboot,
          }
        : { mode: 'dock', nics: buildLinuxNics(metadata.networks) }
    )
    if (dock.result === 'error') {
      const guestLogs = guestLogsOf(dock.report)
      const details = describeFailures(dock.report).join('; ')
      const error = new Error(
        guestLogs === undefined
          ? `the docking of the guest failed: ${details}`
          : `the docking of the guest failed: ${details}. Full report and logs in ${guestLogs} in the guest`
      )
      error.code = 'DOCKING_FAILED'
      // an action applied before the failure may have installed the first boot all the same
      Object.assign(error, context, { reports: { diagnose: diagnose.report, dock: dock.report, windowsReboot } })
      throw error
    }
    if (findFinding(dock.report, FINDING.WINDOWS_STATIC_IP_UNMAPPED) !== undefined) {
      Task.warning('the static network configuration of some adapters could not be carried over, they use DHCP')
    }
    if (dock.report.tools === null) {
      Task.warning('the guest tools disk was not found by the docking ISO')
    }

    if (isWindows) {
      // Windows keeps the RTC in local time, XCP-ng starts it at UTC
      const timeoffset = diagnose.report.os.rtc_timeoffset
      if (typeof timeoffset === 'number' && timeoffset !== 0) {
        await vm.update_platform('timeoffset', String(timeoffset))
      }
    }

    // the `network` of a later run is empty: the first run switched the static adapters to DHCP
    return { diagnose: diagnose.report, dock: dock.report, hasPvDrivers, windowsReboot }
  })
}
