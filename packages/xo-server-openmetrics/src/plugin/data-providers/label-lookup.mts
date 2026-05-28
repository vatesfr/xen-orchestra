/**
 * Label-lookup data provider.
 *
 * Builds the `LabelLookupData` structure that enriches RRD/entity metrics with
 * human-readable names (VM/host/SR/VDI/VIF/PIF/network labels) plus the SR-UUID
 * truncation index used to resolve SRs from XAPI RRD legends.
 *
 * Extracted verbatim from `OpenMetricsPlugin#getLabelLookupData`; the sole
 * change is `this.#xo` → the `xo` parameter. `SR_UUID_TRUNCATIONS` and
 * `indexSrUuidTruncations` moved here with it and are re-exported from
 * `index.mts` for existing importers.
 */

import type {
  XoApp,
  XoHost,
  XoNetwork,
  XoPif,
  XoPool,
  XoSr,
  XoVbd,
  XoVdi,
  XoVif,
  XoVm,
  XoVmController,
} from '@vates/types'
import { createLogger } from '@xen-orchestra/log'

import type { LabelLookupData, XoObject } from '../../types/domain.mjs'

const logger = createLogger('xo:xo-server-openmetrics')

/** UUID truncation lengths used by XAPI RRD legends. */
export const SR_UUID_TRUNCATIONS: ReadonlyArray<number> = [8, 12, 16, 20]

/**
 * Insert every (prefix, suffix) truncation of `uuid` into `index`, mapping
 * each truncation to the full UUID. XCP-ng RRD legends encode the SR as the
 * first 8 chars of the UUID, but older / variant builds may use the suffix;
 * indexing both keeps the SR-name and `sr_type` resolution stable across
 * versions. First match wins, so existing entries are never overwritten.
 *
 * Exported for testability.
 */
export function indexSrUuidTruncations(uuid: string, index: Record<string, string>): void {
  for (const truncLen of SR_UUID_TRUNCATIONS) {
    if (uuid.length < truncLen) continue
    const prefix = uuid.slice(0, truncLen)
    const suffix = uuid.slice(-truncLen)
    if (index[prefix] === undefined) {
      index[prefix] = uuid
    }
    if (index[suffix] === undefined) {
      index[suffix] = uuid
    }
  }
}

/**
 * Get label lookup data for enriching metrics with human-readable names.
 * Gathers VM, Host, SR, VDI, VIF, PIF, and Network labels.
 */
export function getLabelLookupData(xo: XoApp): LabelLookupData {
  const labels: LabelLookupData = {
    vms: {},
    hosts: {},
    srs: {},
    srTruncatedToUuid: {},
    vdiUuidToSrUuid: {},
  }

  // Get all objects and categorize them by type in a single pass
  const allObjects = xo.getObjects() as Record<XoObject['id'], XoObject>

  const vms: (XoVm | XoVmController)[] = []
  const hosts: XoHost[] = []
  const pools: XoPool[] = []
  const srs: XoSr[] = []
  const vbds: XoVbd[] = []
  const vdis: XoVdi[] = []
  const vifs: XoVif[] = []
  const pifs: XoPif[] = []
  const networks: XoNetwork[] = []

  for (const obj of Object.values(allObjects)) {
    switch (obj.type) {
      case 'VM':
      case 'VM-controller':
        vms.push(obj)
        break
      case 'host':
        hosts.push(obj)
        break
      case 'pool':
        pools.push(obj as XoPool)
        break
      case 'SR':
        srs.push(obj)
        break
      case 'VBD':
        vbds.push(obj)
        break
      case 'VDI':
        vdis.push(obj)
        break
      case 'VIF':
        vifs.push(obj)
        break
      case 'PIF':
        pifs.push(obj)
        break
      case 'network':
        networks.push(obj)
        break
    }
  }

  // Build pool label map (uuid -> name_label) for VM enrichment
  const poolLabelMap = new Map<string, string>()
  for (const pool of pools) {
    poolLabelMap.set(pool.uuid, pool.name_label)
  }

  // Build network name map (id -> name_label)
  const networkNameById = new Map<XoNetwork['id'], string>()
  for (const network of networks) {
    networkNameById.set(network.id, network.name_label)
  }

  // Build VDI name map (uuid -> name_label) and VDI UUID to SR UUID map
  // Note: vdi.id === vdi.uuid for VDI objects
  const vdiNameByUuid = new Map<XoVdi['uuid'], string>()
  for (const vdi of vdis) {
    vdiNameByUuid.set(vdi.uuid, vdi.name_label)
    // Build VDI UUID -> SR UUID mapping
    if (vdi.$SR !== undefined) {
      const srObj = allObjects[vdi.$SR]
      if (srObj !== undefined && srObj.type === 'SR') {
        labels.vdiUuidToSrUuid[vdi.uuid] = srObj.uuid
      }
    }
  }

  // Build VBD map (VM id -> device -> VDI info)
  // Note: vbd.VDI is already the VDI UUID (id === uuid for VDI objects)
  const vbdMap = new Map<XoVbd['VM'], Map<string, { name: string; uuid: string }>>()
  for (const vbd of vbds) {
    if (vbd.device === null || vbd.device === '' || vbd.VDI == null) continue

    let vmVbds = vbdMap.get(vbd.VM)
    if (vmVbds === undefined) {
      vmVbds = new Map<string, { name: string; uuid: string }>()
      vbdMap.set(vbd.VM, vmVbds)
    }

    const vdiUuid = vbd.VDI
    const vdiName = vdiNameByUuid.get(vdiUuid)
    if (vdiName !== undefined) {
      vmVbds.set(vbd.device, { name: vdiName, uuid: vdiUuid })
    }
  }

  // Build VIF map (VM id -> vif index -> network name)
  const vifMap = new Map<XoVm['id'] | XoVmController['id'], Map<string, string>>()
  for (const vif of vifs) {
    // VIF device is the index (0, 1, 2...)
    if (vif.$VM === undefined) continue

    let vmVifs = vifMap.get(vif.$VM)
    if (vmVifs === undefined) {
      vmVifs = new Map<string, string>()
      vifMap.set(vif.$VM, vmVifs)
    }

    const networkName = networkNameById.get(vif.$network)
    if (networkName !== undefined) {
      vmVifs.set(vif.device, networkName)
    }
  }

  // Build PIF map (Host id -> device -> network name)
  const pifMap = new Map<XoPif['$host'], Map<string, string>>()
  for (const pif of pifs) {
    let hostPifs = pifMap.get(pif.$host)
    if (hostPifs === undefined) {
      hostPifs = new Map<string, string>()
      pifMap.set(pif.$host, hostPifs)
    }

    const networkName = networkNameById.get(pif.$network)
    if (networkName !== undefined) {
      hostPifs.set(pif.device, networkName)
    }
  }

  // Build VM labels
  for (const vm of vms) {
    const vbdDeviceToVdiName: Record<string, string> = {}
    const vbdDeviceToVdiUuid: Record<string, string> = {}
    const vmVbds = vbdMap.get(vm.id)
    if (vmVbds !== undefined) {
      for (const [device, vdiInfo] of vmVbds) {
        vbdDeviceToVdiName[device] = vdiInfo.name
        vbdDeviceToVdiUuid[device] = vdiInfo.uuid
      }
    }

    const vifIndexToNetworkName: Record<string, string> = {}
    const vmVifs = vifMap.get(vm.id)
    if (vmVifs !== undefined) {
      for (const [index, networkName] of vmVifs) {
        vifIndexToNetworkName[index] = networkName
      }
    }

    labels.vms[vm.uuid] = {
      name_label: vm.name_label,
      is_control_domain: vm.type === 'VM-controller',
      vbdDeviceToVdiName,
      vbdDeviceToVdiUuid,
      vifIndexToNetworkName,
      startTime: vm.startTime ?? null,
      power_state: vm.power_state,
      pool_id: vm.$poolId,
      pool_name: poolLabelMap.get(vm.$poolId) ?? '',
    }
  }

  // Build Host labels
  for (const host of hosts) {
    const pifDeviceToNetworkName: Record<string, string> = {}
    const hostPifs = pifMap.get(host.id)
    if (hostPifs !== undefined) {
      for (const [device, networkName] of hostPifs) {
        pifDeviceToNetworkName[device] = networkName
      }
    }

    labels.hosts[host.uuid] = {
      name_label: host.name_label,
      pifDeviceToNetworkName,
      startTime: host.startTime,
    }
  }

  for (const sr of srs) {
    labels.srs[sr.uuid] = {
      name_label: sr.name_label,
      SR_type: sr.SR_type ?? '',
    }
    indexSrUuidTruncations(sr.uuid, labels.srTruncatedToUuid)
  }

  logger.debug('Label lookup data built', {
    vmCount: Object.keys(labels.vms).length,
    hostCount: Object.keys(labels.hosts).length,
    srCount: Object.keys(labels.srs).length,
  })

  return labels
}
