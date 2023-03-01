'use strict'

const find = require('lodash/find.js')
const groupBy = require('lodash/groupBy.js')
const ignoreErrors = require('promise-toolbox/ignoreErrors')
const omit = require('lodash/omit.js')
const { asyncMap } = require('@xen-orchestra/async-map')
const { CancelToken } = require('promise-toolbox')
const { compareVersions } = require('compare-versions')
const { createVhdStreamWithLength } = require('vhd-lib')
const { defer } = require('golike-defer')

const { cancelableMap } = require('./_cancelableMap.js')
const { Task } = require('./Task.js')
const pick = require('lodash/pick.js')

const TAG_BASE_DELTA = 'xo:base_delta'
exports.TAG_BASE_DELTA = TAG_BASE_DELTA

const TAG_COPY_SRC = 'xo:copy_of'
exports.TAG_COPY_SRC = TAG_COPY_SRC

const ensureArray = value => (value === undefined ? [] : Array.isArray(value) ? value : [value])
const resolveUuid = async (xapi, cache, uuid, type) => {
  if (uuid == null) {
    return uuid
  }
  let ref = cache.get(uuid)
  if (ref === undefined) {
    ref = await xapi.call(`${type}.get_by_uuid`, uuid)
    cache.set(uuid, ref)
  }
  return ref
}

exports.exportDeltaVm = async function exportDeltaVm(
  vm,
  baseVm,
  {
    cancelToken = CancelToken.none,

    // Sets of UUIDs of VDIs that must be exported as full.
    fullVdisRequired = new Set(),

    disableBaseTags = false,
  } = {}
) {
  // refs of VM's VDIs → base's VDIs.
  const baseVdis = {}
  baseVm &&
    baseVm.$VBDs.forEach(vbd => {
      let vdi, snapshotOf
      if ((vdi = vbd.$VDI) && (snapshotOf = vdi.$snapshot_of) && !fullVdisRequired.has(snapshotOf.uuid)) {
        baseVdis[vdi.snapshot_of] = vdi
      }
    })

  const streams = {}
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
    const baseVdi = baseVdis[vdi.snapshot_of]

    vdis[vdiRef] = {
      ...vdi,
      other_config: {
        ...vdi.other_config,
        [TAG_BASE_DELTA]: baseVdi && !disableBaseTags ? baseVdi.uuid : undefined,
      },
      $snapshot_of$uuid: vdi.$snapshot_of?.uuid,
      $SR$uuid: vdi.$SR.uuid,
    }

    streams[`${vdiRef}.vhd`] = await vdi.$exportContent({
      baseRef: baseVdi?.$ref,
      cancelToken,
      format: 'vhd',
    })
  })

  const suspendVdi = vm.$suspend_VDI
  if (suspendVdi !== undefined) {
    const vdiRef = suspendVdi.$ref
    vdis[vdiRef] = {
      ...suspendVdi,
      $SR$uuid: suspendVdi.$SR.uuid,
    }
    streams[`${vdiRef}.vhd`] = await suspendVdi.$exportContent({
      cancelToken,
      format: 'vhd',
    })
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

  return Object.defineProperty(
    {
      version: '1.1.0',
      vbds,
      vdis,
      vifs,
      vm: {
        ...vm,
        other_config:
          baseVm && !disableBaseTags
            ? {
                ...vm.other_config,
                [TAG_BASE_DELTA]: baseVm.uuid,
              }
            : omit(vm.other_config, TAG_BASE_DELTA),
      },
    },
    'streams',
    {
      configurable: true,
      value: streams,
      writable: true,
    }
  )
}

exports.importDeltaVm = defer(async function importDeltaVm(
  $defer,
  deltaVm,
  sr,
  { cancelToken = CancelToken.none, detectBase = true, mapVdisSrs = {}, newMacAddresses = false } = {}
) {
  const { version } = deltaVm
  if (compareVersions(version, '1.0.0') < 0) {
    throw new Error(`Unsupported delta backup version: ${version}`)
  }

  const vmRecord = deltaVm.vm
  const xapi = sr.$xapi

  let baseVm
  if (detectBase) {
    const remoteBaseVmUuid = vmRecord.other_config[TAG_BASE_DELTA]
    if (remoteBaseVmUuid) {
      baseVm = find(xapi.objects.all, obj => (obj = obj.other_config) && obj[TAG_COPY_SRC] === remoteBaseVmUuid)

      if (!baseVm) {
        throw new Error(`could not find the base VM (copy of ${remoteBaseVmUuid})`)
      }
    }
  }

  const cache = new Map()
  const mapVdisSrRefs = {}
  for (const [vdiUuid, srUuid] of Object.entries(mapVdisSrs)) {
    mapVdisSrRefs[vdiUuid] = await resolveUuid(xapi, cache, srUuid, 'SR')
  }

  const baseVdis = {}
  baseVm &&
    baseVm.$VBDs.forEach(vbd => {
      const vdi = vbd.$VDI
      if (vdi !== undefined) {
        baseVdis[vbd.VDI] = vbd.$VDI
      }
    })
  const vdiRecords = deltaVm.vdis

  // 0. Create suspend_VDI
  let suspendVdi
  if (vmRecord.power_state === 'Suspended') {
    const vdi = vdiRecords[vmRecord.suspend_VDI]
    if (vdi === undefined) {
      Task.warning('Suspend VDI not available for this suspended VM', {
        vm: pick(vmRecord, 'uuid', 'name_label'),
      })
    } else {
      suspendVdi = await xapi.getRecord(
        'VDI',
        await xapi.VDI_create({
          ...vdi,
          other_config: {
            ...vdi.other_config,
            [TAG_BASE_DELTA]: undefined,
            [TAG_COPY_SRC]: vdi.uuid,
          },
          sr: mapVdisSrRefs[vdi.uuid] ?? sr.$ref,
        })
      )
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
      other_config: {
        ...vmRecord.other_config,
        [TAG_COPY_SRC]: vmRecord.uuid,
      },
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
  const vbdRecords = deltaVm.vbds
  const vbds = groupBy(vbdRecords, 'VDI')
  const newVdis = {}
  await asyncMap(Object.keys(vdiRecords), async vdiRef => {
    const vdi = vdiRecords[vdiRef]
    let newVdi

    const remoteBaseVdiUuid = detectBase && vdi.other_config[TAG_BASE_DELTA]
    if (remoteBaseVdiUuid) {
      const baseVdi = find(baseVdis, vdi => vdi.other_config[TAG_COPY_SRC] === remoteBaseVdiUuid)
      if (!baseVdi) {
        throw new Error(`missing base VDI (copy of ${remoteBaseVdiUuid})`)
      }

      newVdi = await xapi.getRecord('VDI', await baseVdi.$clone())
      $defer.onFailure(() => newVdi.$destroy())

      await newVdi.update_other_config(TAG_COPY_SRC, vdi.uuid)
      if (vdi.virtual_size > newVdi.virtual_size) {
        await newVdi.$callAsync('resize', vdi.virtual_size)
      }
    } else if (vdiRef === vmRecord.suspend_VDI) {
      // suspendVDI has already created
      newVdi = suspendVdi
    } else {
      newVdi = await xapi.getRecord(
        'VDI',
        await xapi.VDI_create({
          ...vdi,
          other_config: {
            ...vdi.other_config,
            [TAG_BASE_DELTA]: undefined,
            [TAG_COPY_SRC]: vdi.uuid,
          },
          SR: mapVdisSrRefs[vdi.uuid] ?? sr.$ref,
        })
      )
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

  const { streams } = deltaVm

  await Promise.all([
    // Import VDI contents.
    cancelableMap(cancelToken, Object.entries(newVdis), async (cancelToken, [id, vdi]) => {
      for (let stream of ensureArray(streams[`${id}.vhd`])) {
        if (typeof stream === 'function') {
          stream = await stream()
        }
        if (stream.length === undefined) {
          stream = await createVhdStreamWithLength(stream)
        }
        await vdi.$importContent(stream, { cancelToken, format: 'vhd' })
      }
    }),

    // Create VIFs.
    asyncMap(Object.values(deltaVm.vifs), vif => {
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

  await Promise.all([
    deltaVm.vm.ha_always_run && xapi.setField('VM', vmRef, 'ha_always_run', true),
    xapi.setField('VM', vmRef, 'name_label', deltaVm.vm.name_label),
  ])

  return vmRef
})
