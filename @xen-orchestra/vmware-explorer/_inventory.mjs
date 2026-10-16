import { asArray } from './soap/normalize.mjs'

// the references nested in a value are not normalized, only the value of the property itself is
const refOf = value => value?.$value ?? value

// the SOAP library does not always convert the scalars of the answer
const toNumber = value => (value === undefined ? undefined : Number(value))
const isTrue = value => String(value) === 'true'

const typeOf = object => object?.attributes?.['xsi:type']

// the prefix the vmx uses for the disks of a controller, which is how the import names a disk
const CONTROLLER_PREFIXES = {
  ParaVirtualSCSIController: 'scsi',
  VirtualBusLogicController: 'scsi',
  VirtualLsiLogicController: 'scsi',
  VirtualLsiLogicSASController: 'scsi',
  VirtualIDEController: 'ide',
  VirtualAHCIController: 'sata',
  VirtualNVMEController: 'nvme',
}

/**
 * @typedef {object} InventoryDisk
 * @property {string} key - the node of the disk, as the vmx and the import name it, e.g. `scsi0:0`
 * @property {string} label
 * @property {number} capacity - in bytes
 * @property {string | undefined} fileName - datastore path of the descriptor
 * @property {string | undefined} datastore - managed object reference
 * @property {string | undefined} diskMode - `persistent`, `independent_persistent`…
 * @property {string | undefined} backingType - e.g. `VirtualDiskFlatVer2BackingInfo`
 * @property {boolean} thinProvisioned
 * @property {boolean} rdm - raw device mapping, which cannot be read through the datastore
 * @property {boolean} encrypted
 */

/**
 * @typedef {object} InventoryNic
 * @property {string} key - the device key of the card
 * @property {string} label
 * @property {string | undefined} macAddress
 * @property {string | undefined} addressType - `generated`, `manual` or `assigned`
 * @property {string | undefined} network - managed object reference, of a port group when distributed
 * @property {string | undefined} portgroupKey - only for a distributed port group
 * @property {string | undefined} opaqueNetworkId - only for an NSX opaque network
 */

/**
 * The disks and network cards of a VM, from its `config.hardware.device`.
 *
 * @param {unknown} devices - value of `config.hardware.device`
 * @param {Record<string, string>} portgroupsByKey - managed object reference of the distributed port groups, by key
 * @returns {{ disks: InventoryDisk[], nics: InventoryNic[] }}
 */
export function parseDevices(devices, portgroupsByKey = {}) {
  const allDevices = asArray(devices?.VirtualDevice)

  const controllers = new Map()
  for (const device of allDevices) {
    const prefix = CONTROLLER_PREFIXES[typeOf(device)]
    if (prefix !== undefined) {
      controllers.set(Number(device.key), `${prefix}${Number(device.busNumber)}`)
    }
  }

  const disks = []
  const nics = []
  for (const device of allDevices) {
    const label = device.deviceInfo?.label ?? ''
    if (typeOf(device) === 'VirtualDisk') {
      const { backing } = device
      const controller = controllers.get(Number(device.controllerKey))
      const backingType = typeOf(backing)
      disks.push({
        // a disk on a controller the vmx does not name this way cannot be matched by the import
        key: controller === undefined ? `device-${device.key}` : `${controller}:${Number(device.unitNumber)}`,
        label,
        capacity: toNumber(device.capacityInBytes) ?? Number(device.capacityInKB) * 1024,
        fileName: backing?.fileName,
        datastore: refOf(backing?.datastore),
        diskMode: backing?.diskMode,
        backingType,
        thinProvisioned: isTrue(backing?.thinProvisioned),
        rdm: backingType === 'VirtualDiskRawDiskMappingVer1BackingInfo',
        encrypted: backing?.keyId !== undefined,
      })
    } else if (device.macAddress !== undefined || device.addressType !== undefined) {
      // every kind of network card (E1000, VMXNET3…) carries a MAC address, nothing else does
      const { backing } = device
      const portgroupKey = backing?.port?.portgroupKey
      nics.push({
        key: String(device.key),
        label,
        macAddress: device.macAddress,
        addressType: device.addressType,
        network: portgroupKey === undefined ? refOf(backing?.network) : portgroupsByKey[portgroupKey],
        portgroupKey,
        opaqueNetworkId: backing?.opaqueNetworkId,
      })
    }
  }
  return { disks, nics }
}

/**
 * The snapshots of a VM, flattened.
 *
 * @param {unknown} rootList - a `rootSnapshotList`, or the `childSnapshotList` of the recursion
 * @param {string} [parent]
 * @param {object[]} [snapshots] - accumulator of the recursion
 * @returns {{ id: string, name: string, description: string | undefined, createTime: string | undefined, parent: string | undefined }[]}
 */
export function flattenSnapshots(rootList, parent, snapshots = []) {
  for (const node of asArray(rootList)) {
    const id = refOf(node.snapshot)
    snapshots.push({ id, name: node.name, description: node.description, createTime: node.createTime, parent })
    flattenSnapshots(node.childSnapshotList, id, snapshots)
  }
  return snapshots
}

/**
 * The VLAN of a distributed port group: a single id, or the ranges of a trunk.
 *
 * @param {unknown} defaultPortConfig
 * @returns {number | { start: number, end: number }[] | undefined}
 */
export function parseVlan(defaultPortConfig) {
  const vlanId = refOf(defaultPortConfig?.vlan?.vlanId)
  if (vlanId === undefined) {
    return
  }
  if (typeof vlanId !== 'object') {
    return Number(vlanId)
  }
  return asArray(vlanId).map(({ start, end }) => ({ start: Number(start), end: Number(end) }))
}

export const refsOf = value => asArray(value?.ManagedObjectReference).map(refOf)
export { refOf, toNumber }
