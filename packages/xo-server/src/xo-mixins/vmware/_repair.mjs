import Disposable from 'promise-toolbox/Disposable'
import { createLogger } from '@xen-orchestra/log'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'

import {
  buildLinuxNics,
  buildRepairXenstoreData,
  buildWindowsNics,
  clearRepairXenstoreData,
  describeFailures,
  getBlockingFindings,
  guestLogsOf,
  isRepairIsoName,
  isRepairIsoVersion,
  isRepairDone,
  readRepairOutput,
  userdeviceOfXvd,
} from './_repairInputs.mjs'

const { warn } = createLogger('xo:mixins:vmware:repair')

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
 * The repair ISO of a build, deployed on the pool as an ISO SR VDI. A shared SR is preferred: it does not pin
 * the VM to a host. Two commits of the same day: the last one by name, the commits are not ordered otherwise.
 */
function findRepairIso(xapi, isoVersion, context) {
  const candidates = Object.values(xapi.objects.indexes.type.VDI ?? {}).filter(
    vdi => isRepairIsoName(vdi.name_label, isoVersion) && !vdi.missing && vdi.$SR?.content_type === 'iso'
  )
  if (candidates.length === 0) {
    const error = new Error(`no repair ISO xo-repair-${isoVersion}-*.iso in the pool`)
    error.code = 'REPAIR_ISO_NOT_FOUND'
    Object.assign(error, context, { isoVersion })
    throw error
  }
  const names = new Set(candidates.map(vdi => vdi.name_label))
  if (names.size > 1) {
    Task.warning(`several repair ISOs of the build ${isoVersion}: ${[...names].join(', ')}`)
  }
  const byName = (a, b) => (a.name_label < b.name_label ? -1 : a.name_label > b.name_label ? 1 : 0)
  const lastName = candidates.sort(byName).at(-1).name_label
  const lastBuilds = candidates.filter(vdi => vdi.name_label === lastName)
  return lastBuilds.find(vdi => vdi.$SR.shared) ?? lastBuilds[0]
}

// an ISO deployed under the name of another build would be used without notice. Every use of the ISO starts with
// a diagnose run, which writes nothing: a mismatch is found before the guest is modified
function assertIsoVersion(reported, isoVersion, context) {
  if (!isRepairIsoVersion(reported, isoVersion)) {
    const error = new Error(`the repair ISO reports the version ${reported}, the build ${isoVersion} was expected`)
    error.code = 'REPAIR_ISO_VERSION_MISMATCH'
    Object.assign(error, context, { isoVersion, reported })
    throw error
  }
}

const findToolsIso = xapi =>
  Object.values(xapi.objects.indexes.type.VDI ?? {}).find(vdi => vdi.is_tools_iso && !vdi.missing)

// the CD drive of the VM, created when it has none
async function insertCd(xapi, vm, iso) {
  const cdDrive = vm.$VBDs.find(vbd => vbd.type === 'CD')
  if (cdDrive === undefined) {
    return xapi.VBD_create({ type: 'CD', VM: vm.$ref, VDI: iso.$ref, bootable: true })
  }
  if (!cdDrive.empty) {
    await xapi.callAsync('VBD.eject', cdDrive.$ref)
  }
  await xapi.callAsync('VBD.insert', cdDrive.$ref, iso.$ref)
  return cdDrive.$ref
}

/**
 * The repair ISO in the CD drive and the guest tools ISO as a read-only disk, both released on dispose:
 * neither SR supports snapshots.
 */
async function attachRepairDisks(xapi, vmRef, isoVersion, context) {
  const iso = findRepairIso(xapi, isoVersion, context)
  const vm = xapi.getObject(vmRef)

  const cdDriveRef = await insertCd(xapi, vm, iso)

  // optional: without it the ISO repairs everything but the guest agent
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

  return new Disposable(async () => {
    // the VM is imported anyway: failing to release these is not worth failing it
    await xapi
      .callAsync('VBD.eject', cdDriveRef)
      .catch(error => warn('failed to eject the repair ISO', { ...context, error }))
    if (toolsVbdRef !== undefined) {
      await xapi
        .VBD_destroy(toolsVbdRef)
        .catch(error => warn('failed to detach the guest tools ISO', { ...context, error }))
    }
  })
}

/**
 * Boots the VM on the ISO and waits for its result.
 *
 * @returns {Promise<import('./_repairInputs.mjs').RepairOutput>}
 */
function runRepairIso(xapi, vmRef, inputs, context) {
  return Task.run({ properties: { name: `repair ISO: ${inputs.mode}` } }, async () => {
    await xapi.call('VM.set_xenstore_data', vmRef, buildRepairXenstoreData(xapi.getObject(vmRef).xenstore_data, inputs))
    await xapi.call('VM.start', vmRef, false, false)
    // until then the cache may still show the VM halted, or the `done` of the previous run
    await xapi.barrier()

    let vm
    try {
      vm = await xapi.waitObjectState(vmRef, vm => isRepairDone(vm.xenstore_data) || vm.power_state === 'Halted', {
        timeout: RUN_TIMEOUT,
      })
    } catch (cause) {
      await xapi
        .call('VM.hard_shutdown', vmRef)
        .catch(error => warn('failed to stop the VM after the repair ISO timed out', { ...context, error }))
      // most likely the firmware refused the ISO, which then never started
      const error = new Error('the repair ISO did not report its result in time')
      error.code = 'REPAIR_ISO_TIMEOUT'
      error.cause = cause
      Object.assign(error, context)
      throw error
    }

    if (!isRepairDone(vm.xenstore_data)) {
      vm = await xapi
        .waitObjectState(vmRef, vm => isRepairDone(vm.xenstore_data), { timeout: OUTPUT_SYNC_TIMEOUT })
        .catch(cause => {
          const error = new Error('the VM halted without a result from the repair ISO')
          error.code = 'REPAIR_ISO_NO_RESULT'
          error.cause = cause
          Object.assign(error, context, { mode: inputs.mode })
          throw error
        })
    }
    const output = readRepairOutput(vm.xenstore_data, context)

    await xapi
      .waitObjectState(vmRef, vm => vm.power_state === 'Halted', { timeout: POWER_OFF_TIMEOUT })
      .catch(async error => {
        warn('the repair ISO did not power the VM off, forcing it', { ...context, error })
        await xapi.call('VM.hard_shutdown', vmRef)
      })

    if (output.report === undefined) {
      const error = new Error('the repair ISO reported no report')
      error.code = 'REPAIR_ISO_NO_RESULT'
      Object.assign(error, context, { mode: inputs.mode })
      throw error
    }
    Task.info(`repair ISO ${output.version}: ${output.mode} ${output.result}`, {
      findings: output.report.findings.map(({ level, code }) => `${level}:${code}`),
      actions: output.report.actions.map(({ code, status }) => `${code}:${status}`),
      failures: describeFailures(output.report),
    })
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
    error.code = 'REPAIR_OS_DISK_NOT_FOUND'
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
  getBlockingFindings(report).some(finding => finding.code === 'boot_disk_not_first')

function assertNotBlocked(report, context) {
  if (getBlockingFindings(report).length !== 0) {
    const error = new Error(`the guest cannot be repaired: ${describeFailures(report).join('; ')}`)
    error.code = 'REPAIR_BLOCKED'
    Object.assign(error, context, { reports: { diagnose: report } })
    throw error
  }
}

/**
 * Runs `fn` with the VM booting on the repair ISO, then restores how it boots on its disks. `fn` is given a
 * function which boots the VM on the ISO with these inputs, and returns its outputs.
 *
 * Secure Boot stays disabled: the ISO is not signed, and it is enabled again only once the guest has
 * booted on XCP-ng.
 */
async function withRepairIso(xapi, vmRef, { context, isoVersion }, fn) {
  const vm = xapi.getObject(vmRef)
  const { order } = vm.HVM_boot_params
  const { start, start_on } = vm.blocked_operations

  const run = async inputs => {
    const output = await runRepairIso(xapi, vmRef, inputs, context)
    assertIsoVersion(output.version, isoVersion, context)
    return output
  }

  return Disposable.use(attachRepairDisks(xapi, vmRef, isoVersion, context), async () => {
    try {
      await vm.update_blocked_operations({ start: null, start_on: null })
      await vm.update_HVM_boot_params('order', 'dc')
      if (vm.HVM_boot_params.firmware === 'uefi') {
        // an absent key means `auto`, which enforces Secure Boot when the pool has certificates
        await vm.update_platform('secureboot', 'false')
      }
      return await fn(run)
    } finally {
      const current = xapi.getObject(vmRef)
      await xapi.call('VM.set_xenstore_data', vmRef, clearRepairXenstoreData(current.xenstore_data))
      await current.update_HVM_boot_params('order', order)
      await current.update_blocked_operations({ start: start ?? null, start_on: start_on ?? null })
    }
  })
}

/**
 * A diagnose run on a halted VM, e.g. to read the state of a Windows first boot which could not report it.
 *
 * @returns {Promise<import('./_repairInputs.mjs').RepairReport>}
 */
export async function diagnoseOffline({ xapi, vmRef, context, isoVersion }) {
  const { report } = await withRepairIso(xapi, vmRef, { context, isoVersion }, run => run({ mode: 'diagnose' }))
  return report
}

/**
 * Prepares an imported VM to boot on XCP-ng with the repair ISO: a diagnose run, which modifies nothing,
 * then a repair run. The VM must be halted, and is left halted, booting on its disks.
 *
 * @param {object} params
 * @param {import('xen-api').Xapi} params.xapi
 * @param {string} params.vmRef
 * @param {object} params.metadata - from `getTransferableVmMetadata`
 * @param {object} [params.options]
 * @param {'standard' | 'full'} [params.options.windowsCleanup]
 * @param {string} [params.options.windowsMsiPatterns]
 * @param {string} params.isoVersion - build of the repair ISO to use
 * @returns {Promise<{ diagnose: object, repair: object }>} the reports of both runs
 */
export async function repairImportedVm({ xapi, vmRef, metadata, options = {}, isoVersion }) {
  const vm = xapi.getObject(vmRef)
  const context = { vmId: vm.uuid, sourceVmId: metadata.vmId }

  return withRepairIso(xapi, vmRef, { context, isoVersion }, async run => {
    let diagnose = await run({ mode: 'diagnose' })
    if (isBlockedOnBootDisk(diagnose.report)) {
      const osDisk = diagnose.report.findings.find(finding => finding.code === 'boot_disk_not_first').data?.os_disk
      if (osDisk === undefined) {
        // the details are the first thing dropped from a report too large for xenstore
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
    if (diagnose.report.findings.some(finding => finding.code === 'pv_drivers_unsupported')) {
      Task.warning(
        'this Windows version is older than the XCP-ng PV drivers support (build 14393): the VM will run on emulated devices, without management agent'
      )
    }
    const repair = await run(
      isWindows
        ? {
            mode: 'repair',
            windowsCleanup: options.windowsCleanup,
            windowsMsiPatterns: options.windowsMsiPatterns,
            windowsNics: buildWindowsNics({
              guestNics: metadata.guestNics,
              networks: metadata.networks,
              reportNetwork: diagnose.report.network,
            }),
          }
        : { mode: 'repair', nics: buildLinuxNics(metadata.networks) }
    )
    if (repair.result === 'error') {
      const guestLogs = guestLogsOf(repair.report)
      const details = describeFailures(repair.report).join('; ')
      const error = new Error(
        guestLogs === undefined
          ? `the repair of the guest failed: ${details}`
          : `the repair of the guest failed: ${details}. Full report and logs in ${guestLogs} in the guest`
      )
      error.code = 'REPAIR_FAILED'
      Object.assign(error, context, { reports: { diagnose: diagnose.report, repair: repair.report } })
      throw error
    }
    if (repair.report.findings.some(finding => finding.code === 'windows_static_ip_unmapped')) {
      Task.warning('the static network configuration of some adapters could not be carried over, they use DHCP')
    }
    if (repair.report.tools === null) {
      Task.warning('the guest tools disk was not found by the repair ISO')
    }

    if (isWindows) {
      // Windows keeps the RTC in local time, XCP-ng starts it at UTC
      const timeoffset = diagnose.report.os.rtc_timeoffset
      if (typeof timeoffset === 'number' && timeoffset !== 0) {
        await vm.update_platform('timeoffset', String(timeoffset))
      }
    }

    // the `network` of a later run is empty: the first run switched the static adapters to DHCP
    return { diagnose: diagnose.report, repair: repair.report }
  })
}
