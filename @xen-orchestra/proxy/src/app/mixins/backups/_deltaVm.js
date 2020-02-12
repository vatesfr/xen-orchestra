import cancelable from 'promise-toolbox/cancelable'
import compareVersions from 'compare-versions'
import defer from 'golike-defer'
import find from 'lodash/find'
import groupBy from 'lodash/groupBy'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import map from 'lodash/map'
import omit from 'lodash/omit'

import { createVhdStreamWithLength } from 'vhd-lib'

const TAG_BASE_DELTA = 'xo:base_delta'
const TAG_COPY_SRC = 'xo:copy_of'

const ensureArray = value =>
  value === undefined ? [] : Array.isArray(value) ? value : [value]

export const exportDeltaVm = cancelable(async function (
  $cancelToken,
  vm,
  baseVm,
  {
    bypassVdiChainsCheck = false,

    // Contains a vdi.$id set of vmId.
    fullVdisRequired = [],

    disableBaseTags = false,
    snapshotNameLabel = undefined,
  } = {}
) {
  // refs of VM's VDIs → base's VDIs.
  const baseVdis = {}
  baseVm &&
    baseVm.$VBDs.forEach(vbd => {
      let vdi, snapshotOf
      if (
        (vdi = vbd.$VDI) &&
        (snapshotOf = vdi.$snapshot_of) &&
        !find(fullVdisRequired, id => snapshotOf.$id === id)
      ) {
        baseVdis[vdi.snapshot_of] = vdi
      }
    })

  const streams = {}
  const vdis = {}
  const vbds = {}
  await Promise.all(
    vm.$VBDs.map(async vbd => {
      let vdi
      if (vbd.type !== 'Disk' || !(vdi = vbd.$VDI)) {
        // Ignore this VBD.
        return
      }

      // If the VDI name start with `[NOBAK]`, do not export it.
      if (vdi.name_label.startsWith('[NOBAK]')) {
        // FIXME: find a way to not create the VDI snapshot in the
        // first time.
        //
        // The snapshot must not exist otherwise it could break the
        // next export.
        ignoreErrors.call(vdi.$destroy())
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
          [TAG_BASE_DELTA]:
            baseVdi && !disableBaseTags ? baseVdi.uuid : undefined,
        },
        $snapshot_of$uuid: vdi.$snapshot_of?.uuid,
        $SR$uuid: vdi.$SR.uuid,
      }

      streams[`${vdiRef}.vhd`] = await vdi.$xapi.VDI_exportContent(
        $cancelToken,
        vdi.$ref,
        {
          baseRef: baseVdi?.$ref,
          format: 'vhd',
        }
      )
    })
  )

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
})

export const importDeltaVm = defer(
  async ($defer, deltaVm, sr, { detectBase = true, mapVdisSrs = {} } = {}) => {
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
        baseVm = find(
          xapi.objects.all,
          obj =>
            (obj = obj.other_config) && obj[TAG_COPY_SRC] === remoteBaseVmUuid
        )

        if (!baseVm) {
          throw new Error(
            `could not find the base VM (copy of ${remoteBaseVmUuid})`
          )
        }
      }
    }

    const baseVdis = {}
    baseVm &&
      baseVm.$VBDs.forEach(vbd => {
        const vdi = vbd.$VDI
        if (vdi !== undefined) {
          baseVdis[vbd.VDI] = vbd.$VDI
        }
      })

    const vmRef = await xapi.VM_create({
      ...vmRecord,
      affinity: undefined,
      blocked_operations: {
        ...vmRecord.blocked_operations,
        start: 'Importing…',
      },
      ha_always_run: false,
      is_a_template: false,
      name_label: '[Importing…] ' + vmRecord.name_label,
      other_config: {
        ...vmRecord.other_config,
        [TAG_COPY_SRC]: vmRecord.uuid,
      },
    })
    $defer.onFailure.call(xapi, 'VM_destroy', vmRef)

    // 2. Delete all VBDs which may have been created by the import.
    await Promise.all(
      (await xapi.getField('VM', vmRef, 'VBDs')).map(ref =>
        ignoreErrors.call(xapi.call('VBD.destroy', ref))
      )
    )

    // 3. Create VDIs & VBDs.
    const vbdRecords = deltaVm.vbds
    const vdiRecords = deltaVm.vdis
    const vbds = groupBy(vbdRecords, 'VDI')
    const newVdis = {}
    await Promise.all(
      Object.keys(vdiRecords).map(async vdiId => {
        const vdi = vdiRecords[vdiId]
        let newVdi

        const remoteBaseVdiUuid = detectBase && vdi.other_config[TAG_BASE_DELTA]
        if (remoteBaseVdiUuid) {
          const baseVdi = find(
            baseVdis,
            vdi => vdi.other_config[TAG_COPY_SRC] === remoteBaseVdiUuid
          )
          if (!baseVdi) {
            throw new Error(`missing base VDI (copy of ${remoteBaseVdiUuid})`)
          }

          newVdi = await xapi.getRecord('VDI', await baseVdi.$clone())
          $defer.onFailure(() => newVdi.$destroy())

          await newVdi.update_other_config(TAG_COPY_SRC, vdi.uuid)
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
              sr: mapVdisSrs[vdi.uuid] ?? sr.$ref,
            })
          )
          $defer.onFailure(() => newVdi.$destroy())
        }

        await Promise.all(
          Object.values(vbds[vdiId]).map(vbd =>
            xapi.VBD_create({
              ...vbd,
              VDI: newVdi.$ref,
              VM: vmRef,
            })
          )
        )

        newVdis[vdiId] = newVdi
      })
    )

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
        const networksByNameLabel =
          networksByNameLabelByVlan[vlan] ||
          (networksByNameLabelByVlan[vlan] = {})
        defaultNetwork = networksByNameLabel[object.name_label] = object
      }
    })

    const { streams } = deltaVm

    await Promise.all([
      // Import VDI contents.
      Promise.all(
        map(newVdis, async (vdi, id) => {
          for (let stream of ensureArray(streams[`${id}.vhd`])) {
            if (typeof stream === 'function') {
              stream = await stream()
            }
            if (stream.length === undefined) {
              stream = await createVhdStreamWithLength(stream)
            }
            await vdi.$importContent(stream, { format: 'vhd' })
          }
        })
      ),

      // Wait for VDI export tasks (if any) termination.
      Promise.all(Object.values(streams).map(stream => stream.task)),

      // Create VIFs.
      Promise.all(
        Object.values(deltaVm.vifs).map(vif => {
          let network =
            vif.$network$uuid &&
            xapi.getObjectByUuid(vif.$network$uuid, undefined)

          if (network === undefined) {
            const { $network$VLAN: vlan = -1 } = vif
            const networksByNameLabel = networksByNameLabelByVlan[vlan]
            if (networksByNameLabel !== undefined) {
              network = networksByNameLabel[vif.$network$name_label]
              if (network === undefined) {
                network =
                  networksByNameLabel[Object.keys(networksByNameLabel)[0]]
              }
            } else {
              network = defaultNetwork
            }
          }

          if (network) {
            return xapi.VIF_create({
              ...vif,
              network: network.$ref,
              VM: vmRef,
            })
          }
        })
      ),
    ])

    await Promise.all([
      deltaVm.vm.ha_always_run &&
        xapi.setField('VM', vmRef, 'ha_always_run', true),
      xapi.setField('VM', vmRef, 'name_label', deltaVm.vm.name_label),
    ])

    return vmRef
  }
)
