import groupBy from 'lodash/groupBy.js'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import { asyncMap } from '@xen-orchestra/async-map'
import { CancelToken } from 'promise-toolbox'
import { compareVersions } from 'compare-versions'
import { defer } from 'golike-defer'

import { cancelableMap } from './_cancelableMap.mjs'
import { Task } from './Task.mjs'
import pick from 'lodash/pick.js'
import { BASE_DELTA_VDI, COPY_OF, VM_UUID } from './_otherConfig.mjs'

import { XapiDiskSource } from '@xen-orchestra/xapi'
import { toVhdStream } from 'vhd-lib/disk-consumer/index.mjs'

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

  const vtpms = await Promise.all(
    vm.$VTPMs.map(async vtpm => {
      let content
      try {
        content = await vm.$xapi.call('VTPM.get_contents', vtpm.$ref)
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
  { cancelToken = CancelToken.none, newMacAddresses = false } = {}
) {
  const { version } = incrementalVm
  if (compareVersions(version, '1.0.0') < 0) {
    throw new Error(`Unsupported delta backup version: ${version}`)
  }

  const vmRecord = incrementalVm.vm
  const xapi = sr.$xapi

  const vdiRecords = incrementalVm.vdis

  // 0. Create suspend_VDI
  let suspendVdi
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

  // 1. Create the VM.
  const vmRef = await xapi.VM_create(
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

  // 2. Delete all VBDs which may have been created by the import.
  await asyncMap(await xapi.getField('VM', vmRef, 'VBDs'), ref => ignoreErrors.call(xapi.call('VBD.destroy', ref)))

  // 3. Create VDIs & VBDs.
  const vbdRecords = incrementalVm.vbds
  const vbds = groupBy(vbdRecords, 'VDI')
  const newVdis = {}
  await asyncMap(Object.keys(vdiRecords), async vdiRef => {
    const vdi = vdiRecords[vdiRef]
    let newVdi

    if (vdi.baseVdi?.$ref !== undefined) {
      newVdi = await xapi.getRecord('VDI', await xapi.VDI_clone(vdi.baseVdi.$ref))
      $defer.onFailure(() => newVdi.$destroy())

      await newVdi.update_other_config(COPY_OF, vdi.uuid)
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
        const stream = await toVhdStream({ disk })
        await vdi.$importContent(stream, { cancelToken, format: 'vhd' })
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

  await Promise.all([
    incrementalVm.vm.ha_always_run && xapi.setField('VM', vmRef, 'ha_always_run', true),
    xapi.setField('VM', vmRef, 'name_label', incrementalVm.vm.name_label),
  ])

  return vmRef
})
