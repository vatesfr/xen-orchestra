import groupBy from 'lodash/groupBy.js'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import { asyncMap } from '@xen-orchestra/async-map'
import { CancelToken } from 'promise-toolbox'
import { compareVersions } from 'compare-versions'
import { defer } from 'golike-defer'

import { cancelableMap } from './_cancelableMap.mjs'
import { Task } from './Task.mjs'
import pick from 'lodash/pick.js'
import { BASE_DELTA_VDI, CONTENT_KEY, COPY_OF, VM_UUID } from './_otherConfig.mjs'

import { VHD_MAX_SIZE, XapiDiskSource } from '@xen-orchestra/xapi'
import { toVhdStream } from 'vhd-lib/disk-consumer/index.mjs'
import { toQcow2Stream } from '@xen-orchestra/qcow2'

const ensureArray = value => (value === undefined ? [] : Array.isArray(value) ? value : [value])

export async function exportIncrementalVm(
  vm,
  baseVdis = {},
  { cancelToken = CancelToken.none, nbdConcurrency = 1, preferNbd } = {}
) {
  // refs of VM's VDIs → base's VDIs.

  const disks = {}
  const vdis = {}
  const vbds = {}
  await cancelableMap(cancelToken, vm.$VBDs, async (cancelToken, vbd) => {
    let vdi
    if (vbd.type !== 'Disk' || !(vdi = vbd.$VDI)) {
      // Ignore this VBD.
      return
    }

    vbds[vbd.$ref] = vbd

    const vdiRef = vdi.$ref
    if (vdiRef in vdis) {
      // This VDI has already been managed.
      return
    }

    // Look for a snapshot of this vdi in the base VM.
    const baseVdi = baseVdis[vdi.$snapshot_of.uuid]

    vdis[vdiRef] = {
      ...vdi,
      other_config: {
        ...vdi.other_config,
        [BASE_DELTA_VDI]: baseVdi?.uuid,
        [VM_UUID]:
          vm.$snapshot_of?.uuid ?? // vm is a snapshot
          vm.uuid, // vm is a not snapshot
      },
      $snapshot_of$uuid: vdi.$snapshot_of?.uuid,
      $SR$uuid: vdi.$SR.uuid,
    }
    disks[vdiRef] = new XapiDiskSource({
      vdiRef,
      xapi: vm.$xapi,
      baseRef: baseVdi?.$ref,
      nbdConcurrency,
      preferNbd,
    })
    await disks[vdiRef].init()
  })

  const suspendVdi = vm.$suspend_VDI
  if (suspendVdi !== undefined) {
    const vdiRef = suspendVdi.$ref
    vdis[vdiRef] = {
      ...suspendVdi,
      $SR$uuid: suspendVdi.$SR.uuid,
    }
    disks[vdiRef] = new XapiDiskSource({
      vdiRef: suspendVdi.$ref,
      xapi: vm.$xapi,
      nbdConcurrency,
      preferNbd,
    })
    await disks[vdiRef].init()
  }

  const vifs = {}
  vm.$VIFs.forEach(vif => {
    const network = vif.$network
    vifs[vif.$ref] = {
      ...vif,
      $network$uuid: network.uuid,
      $network$name_label: network.name_label,
      $network$VLAN: network.$PIFs[0]?.VLAN,
    }
  })

  // Get a fresh list of VM's VTPM to avoid `vm.VTPMs: [undefined]`
  const vmVtpms = await vm.$xapi.getField('VM', vm.$ref, 'VTPMs')
  const vtpms = await Promise.all(
    vmVtpms.map(async vtpmRef => {
      let content
      try {
        content = await vm.$xapi.call('VTPM.get_contents', vtpmRef)
      } catch (err) {
        console.error(err)
      }
      return content
    })
  )

  return {
    version: '1.1.0',
    vbds,
    vdis,
    vifs,
    vm: {
      ...vm,
    },
    vtpms,
    disks,
  }
}

export const importIncrementalVm = defer(async function importIncrementalVm(
  $defer,
  incrementalVm,
  sr,
  { cancelToken = CancelToken.none, newMacAddresses = false, targetRef = undefined } = {}
) {
  const { version } = incrementalVm
  if (compareVersions(version, '1.0.0') < 0) {
    throw new Error(`Unsupported delta backup version: ${version}`)
  }

  const vmRecord = incrementalVm.vm
  const xapi = sr.$xapi

  const vdiRecords = incrementalVm.vdis

  // When targetRef is provided, update the existing VM instead of creating a new one.
  const targetVm = targetRef !== undefined ? xapi.getObjectByRef(targetRef, undefined) : undefined
  const isUpdate = targetVm !== undefined && !targetVm.is_a_snapshot && !targetVm.is_a_template

  // 0. Create suspend_VDI (only when creating a new VM).
  let suspendVdi
  if (!isUpdate) {
    if (vmRecord.suspend_VDI !== undefined && vmRecord.suspend_VDI !== 'OpaqueRef:NULL') {
      const vdi = vdiRecords[vmRecord.suspend_VDI]
      if (vdi === undefined) {
        Task.warning('Suspend VDI not available for this suspended VM', {
          vm: pick(vmRecord, 'uuid', 'name_label', 'suspend_VDI'),
        })
      } else {
        suspendVdi = await xapi.getRecord('VDI', await xapi.VDI_create(vdi))
        $defer.onFailure(() => suspendVdi.$destroy())
      }
    }
  }

  // 1. Create the VM or update the existing one.
  let vmRef
  if (isUpdate) {
    vmRef = targetRef
    await Promise.all([
      xapi.setFields('VM', vmRef, {
        actions_after_crash: vmRecord.actions_after_crash,
        actions_after_reboot: vmRecord.actions_after_reboot,
        actions_after_shutdown: vmRecord.actions_after_shutdown,
        domain_type: vmRecord.domain_type,
        ha_restart_priority: vmRecord.ha_restart_priority,
        has_vendor_device: vmRecord.has_vendor_device,
        HVM_boot_params: vmRecord.HVM_boot_params,
        HVM_boot_policy: vmRecord.HVM_boot_policy,
        HVM_shadow_multiplier: vmRecord.HVM_shadow_multiplier,
        memory_dynamic_max: vmRecord.memory_dynamic_max,
        memory_dynamic_min: vmRecord.memory_dynamic_min,
        memory_static_max: vmRecord.memory_static_max,
        memory_static_min: vmRecord.memory_static_min,
        name_description: vmRecord.name_description,
        order: vmRecord.order,
        other_config: vmRecord.other_config,
        platform: vmRecord.platform,
        PV_args: vmRecord.PV_args,
        PV_bootloader: vmRecord.PV_bootloader,
        PV_bootloader_args: vmRecord.PV_bootloader_args,
        PV_kernel: vmRecord.PV_kernel,
        PV_legacy_args: vmRecord.PV_legacy_args,
        PV_ramdisk: vmRecord.PV_ramdisk,
        recommendations: vmRecord.recommendations,
        shutdown_delay: vmRecord.shutdown_delay,
        start_delay: vmRecord.start_delay,
        suspend_SR: vmRecord.suspend_SR,
        tags: vmRecord.tags,
        user_version: vmRecord.user_version,
        VCPUs_at_startup: vmRecord.VCPUs_at_startup,
        VCPUs_max: vmRecord.VCPUs_max,
        VCPUs_params: vmRecord.VCPUs_params,
        xenstore_data: vmRecord.xenstore_data,
      }),
      targetVm.update_blocked_operations({
        start: 'Importing…',
        start_on: 'Importing…',
      }),
    ])
  } else {
    vmRef = await xapi.VM_create(
      {
        ...vmRecord,
        affinity: undefined,
        blocked_operations: {
          ...vmRecord.blocked_operations,
          start: 'Importing…',
          start_on: 'Importing…',
        },
        ha_always_run: false,
        is_a_template: false,
        name_label: '[Importing…] ' + vmRecord.name_label,
      },
      {
        bios_strings: vmRecord.bios_strings,
        generateMacSeed: newMacAddresses,
        suspend_VDI: suspendVdi?.$ref,
      }
    )
    $defer.onFailure.call(xapi, 'VM_destroy', vmRef)
  }

  // 2. Delete all VBDs which may have been created by the import.
  // In update mode, also collect the VDI refs so orphaned VDIs can be destroyed after new ones are created.
  const existingVbdRefs = await xapi.getField('VM', vmRef, 'VBDs')
  const oldVdiRefs = new Set(
    isUpdate
      ? (await asyncMap(existingVbdRefs, ref => xapi.getField('VBD', ref, 'VDI'))).filter(
          ref => ref !== undefined && ref !== 'OpaqueRef:NULL'
        )
      : []
  )
  await asyncMap(existingVbdRefs, ref => ignoreErrors.call(xapi.call('VBD.destroy', ref)))

  // 3. Create VDIs & VBDs.
  const vbdRecords = incrementalVm.vbds
  const vbds = groupBy(vbdRecords, 'VDI')
  const newVdis = {}
  await asyncMap(Object.keys(vdiRecords), async vdiRef => {
    const vdi = vdiRecords[vdiRef]
    let newVdi

    if (vdi.baseVdi?.$ref !== undefined) {
      if (isUpdate) {
        // In update mode, reuse the existing target VDI directly — no clone needed.
        newVdi = vdi.baseVdi
        oldVdiRefs.delete(newVdi.$ref)
      } else {
        newVdi = await xapi.getRecord('VDI', await xapi.VDI_clone(vdi.baseVdi.$ref))
        $defer.onFailure(() => newVdi.$destroy())
      }
      await newVdi.update_other_config(COPY_OF, vdi.uuid)
      if (vdi.other_config[CONTENT_KEY] !== undefined) {
        await newVdi.update_other_config(CONTENT_KEY, vdi.other_config[CONTENT_KEY])
      }
      if (vdi.virtual_size > newVdi.virtual_size) {
        await newVdi.$callAsync('resize', vdi.virtual_size)
      }
    } else if (vdiRef === vmRecord.suspend_VDI) {
      // suspendVDI has already created
      newVdi = suspendVdi
    } else {
      newVdi = await xapi.getRecord('VDI', await xapi.VDI_create(vdi))
      $defer.onFailure(() => newVdi.$destroy())
    }

    const vdiVbds = vbds[vdiRef]
    if (vdiVbds !== undefined) {
      await asyncMap(Object.values(vdiVbds), vbd =>
        xapi.VBD_create({
          ...vbd,
          VDI: newVdi.$ref,
          VM: vmRef,
        })
      )
    }

    newVdis[vdiRef] = newVdi
  })

  // 3.5. Destroy old VDIs that are no longer attached to the VM.
  // Uses ignoreErrors because some storage backends refuse to destroy a VDI that still has snapshot children;
  // those VDIs will become truly orphaned once the old snapshot VMs are cleaned up by _deleteOldEntries.
  await asyncMap([...oldVdiRefs], ref => ignoreErrors.call(xapi.call('VDI.destroy', ref)))

  // 4. For updates, destroy existing VIFs before recreating them.
  if (isUpdate) {
    await asyncMap(await xapi.getField('VM', vmRef, 'VIFs'), ref => ignoreErrors.call(xapi.call('VIF.destroy', ref)))
  }

  const networksByNameLabelByVlan = {}
  let defaultNetwork
  Object.values(xapi.objects.all).forEach(object => {
    if (object.$type === 'network') {
      const pif = object.$PIFs[0]
      if (pif === undefined) {
        // ignore network
        return
      }
      const vlan = pif.VLAN
      const networksByNameLabel = networksByNameLabelByVlan[vlan] || (networksByNameLabelByVlan[vlan] = {})
      defaultNetwork = networksByNameLabel[object.name_label] = object
    }
  })

  const { disks } = incrementalVm
  await Promise.all([
    // Import VDI contents.
    cancelableMap(cancelToken, Object.entries(newVdis), async (cancelToken, [id, vdi]) => {
      for (const disk of ensureArray(disks[id])) {
        if (disk === null) {
          // we restore a backup and reuse completely a local snapshot
          continue
        }
        await xapi.setField('VDI', vdi.$ref, 'name_label', `[Importing] ${vdiRecords[id].name_label}`)

        let stream, format
        if (vdi.virtual_size > VHD_MAX_SIZE) {
          stream = await toQcow2Stream(disk)
          format = 'qcow2'
        } else {
          stream = await toVhdStream(disk)
          format = 'vhd'
        }

        await vdi.$importContent(stream, { cancelToken, format })

        await xapi.setField('VDI', vdi.$ref, 'name_label', vdiRecords[id].name_label)
      }
    }),

    // Create VIFs.
    asyncMap(Object.values(incrementalVm.vifs), vif => {
      let network = vif.$network$uuid && xapi.getObjectByUuid(vif.$network$uuid, undefined)

      if (network === undefined) {
        const { $network$VLAN: vlan = -1 } = vif
        const networksByNameLabel = networksByNameLabelByVlan[vlan]
        if (networksByNameLabel !== undefined) {
          network = networksByNameLabel[vif.$network$name_label]
          if (network === undefined) {
            network = networksByNameLabel[Object.keys(networksByNameLabel)[0]]
          }
        } else {
          network = defaultNetwork
        }
      }

      if (network) {
        return xapi.VIF_create(
          {
            ...vif,
            network: network.$ref,
            VM: vmRef,
          },
          {
            MAC: newMacAddresses ? undefined : vif.MAC,
          }
        )
      }
    }),
  ])
  // recreate VTPMs
  await Promise.all(
    (incrementalVm.vtpms ?? []).map(async contents => {
      await xapi.VTPM_create({ VM: vmRef, contents })
    })
  )
  const vm = await xapi.getRecord('VM', vmRef)
  await Promise.all([
    vmRecord.ha_always_run && xapi.setField('VM', vmRef, 'ha_always_run', true),
    xapi.setField('VM', vmRef, 'name_label', vmRecord.name_label),
    // correctly unlock the VM and reapply the target blocked operations
    vm.update_blocked_operations({
      start: null,
      start_on: null,
      ...vmRecord.blocked_operations,
    }),
  ])

  return vmRef
})
