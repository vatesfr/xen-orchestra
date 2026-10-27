import { UNSAFE_KEYS } from './parsers/utils.mjs'
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
 * The backing of a device, as the SOAP library returns it: only the fields read here.
 *
 * @typedef {object} RawBacking
 * @property {string} [fileName]
 * @property {unknown} [datastore]
 * @property {string} [diskMode]
 * @property {unknown} [thinProvisioned]
 * @property {unknown} [keyId]
 * @property {{ portgroupKey?: string }} [port]
 * @property {unknown} [network]
 * @property {string} [opaqueNetworkId]
 */

/**
 * A `VirtualDevice`, as the SOAP library returns it: only the fields read here.
 *
 * @typedef {object} RawDevice
 * @property {string | number} [key]
 * @property {string | number} [busNumber]
 * @property {string | number} [controllerKey]
 * @property {string | number} [unitNumber]
 * @property {string | number} [capacityInBytes]
 * @property {string | number} [capacityInKB]
 * @property {{ label?: string }} [deviceInfo]
 * @property {string} [macAddress]
 * @property {string} [addressType]
 * @property {RawBacking} [backing]
 */

/**
 * The value of `config.hardware.device`.
 *
 * @typedef {{ VirtualDevice?: RawDevice | RawDevice[] }} RawDevices
 */

/**
 * A `VirtualMachineSnapshotTree`, as the SOAP library returns it: only the fields read here.
 *
 * @typedef {object} RawSnapshotTree
 * @property {RawSnapshotTree | RawSnapshotTree[]} [childSnapshotList]
 */

/**
 * The `defaultPortConfig` of a distributed port group: only the fields read here.
 *
 * @typedef {{ vlan?: { vlanId?: unknown } }} RawPortConfig
 */

/**
 * The objects of the inventory, as {@link Esxi#search} returns them: only the properties read by
 * `Esxi#getInventory`, any of them can be missing from the answer.
 *
 * @typedef {{ name?: string }} RawDatacenter
 * @typedef {{ name?: string, parent?: unknown }} RawCluster
 * @typedef {{ name?: string, parent?: unknown }} RawHost
 * @typedef {{ summary?: { name?: string, type?: string, capacity?: unknown, freeSpace?: unknown }, host?: unknown }} RawDatastore
 * @typedef {{ parent?: unknown }} RawChild
 * @typedef {{ name?: string }} RawNetwork
 * @typedef {{ name?: string, version?: string, instanceUuid?: string }} RawAboutInfo
 * @typedef {{ name?: string, key?: string, 'config.defaultPortConfig'?: RawPortConfig }} RawPortgroup
 * @typedef {{
 *   'config.name'?: string,
 *   'config.annotation'?: string,
 *   'config.instanceUuid'?: string,
 *   'config.firmware'?: string,
 *   'config.bootOptions.efiSecureBootEnabled'?: unknown,
 *   'config.template'?: unknown,
 *   'config.hardware.numCPU'?: unknown,
 *   'config.hardware.memoryMB'?: unknown,
 *   'config.hardware.device'?: RawDevices,
 *   'runtime.powerState'?: 'poweredOff' | 'poweredOn' | 'suspended',
 *   'runtime.host'?: unknown,
 *   datastore?: unknown,
 *   snapshot?: { currentSnapshot?: unknown, rootSnapshotList?: RawSnapshotTree | RawSnapshotTree[] },
 * }} RawVm
 */

/**
 * @typedef {object} InventoryDisk
 * @property {string} key - the node of the disk, as the vmx and the import name it, e.g. `scsi0:0`
 * @property {string} label
 * @property {number} capacity - in bytes
 * @property {string | undefined} datastore - managed object reference
 * @property {string | undefined} diskMode - `persistent`, `independent_persistent`…
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
 */

/**
 * The disks and network cards of a VM, from its `config.hardware.device`.
 *
 * @param {RawDevices | undefined} devices - value of `config.hardware.device`
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
        datastore: refOf(backing?.datastore),
        diskMode: backing?.diskMode,
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
      })
    }
  }
  return { disks, nics }
}

/**
 * The number of snapshots of a VM, at every depth of its tree.
 *
 * @param {RawSnapshotTree | RawSnapshotTree[] | undefined} rootList - a `rootSnapshotList`, or the `childSnapshotList` of the recursion
 * @returns {number}
 */
export function countSnapshots(rootList) {
  let count = 0
  for (const node of asArray(rootList)) {
    count += 1 + countSnapshots(node.childSnapshotList)
  }
  return count
}

/**
 * The VLAN of a distributed port group: a single id, or the ranges of a trunk.
 *
 * @param {RawPortConfig | undefined} defaultPortConfig
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

/**
 * The datacenter an object belongs to, found by walking up its parents: the folders and compute
 * resources between a host and its datacenter can be nested at any depth.
 *
 * @param {string | undefined} id - managed object reference
 * @param {Map<string, string | undefined>} parents - parent of each folder, compute resource and host
 * @param {Set<string>} datacenterIds
 * @returns {string | undefined}
 */
export function findDatacenter(id, parents, datacenterIds) {
  // a parent loop would be a broken answer, not a deep tree
  for (let depth = 0; id !== undefined && depth <= parents.size; depth++) {
    if (datacenterIds.has(id)) {
      return id
    }
    id = parents.get(id)
  }
}

const refsOf = value => asArray(value?.ManagedObjectReference).map(refOf)

/**
 * The hosts which mount a datastore and can reach it.
 *
 * @param {unknown} mounts - value of the `host` property of the datastore
 * @returns {Set<string>} managed object references of the hosts
 */
export function reachingHostIds(mounts) {
  const hostIds = new Set()
  for (const { key, mountInfo } of asArray(mounts?.DatastoreHostMount)) {
    if (isTrue(mountInfo?.mounted) && isTrue(mountInfo?.accessible)) {
      hostIds.add(refOf(key))
    }
  }
  return hostIds
}

/**
 * The inventory, from the objects `Esxi#getInventory` reads: no request is made here.
 * The objects reference each other through their managed object references.
 *
 * @param {object} raw
 * @param {RawAboutInfo} raw.about
 * @param {Record<string, RawDatacenter>} raw.datacenters
 * @param {Record<string, RawCluster>} raw.clusters
 * @param {Record<string, RawHost>} raw.hosts
 * @param {Record<string, RawDatastore>} raw.datastores
 * @param {Record<string, RawNetwork>} raw.networks
 * @param {Record<string, RawPortgroup>} raw.portgroups
 * @param {Record<string, RawVm>} raw.vms
 * @param {Record<string, RawChild>} raw.folders
 * @param {Record<string, RawChild>} raw.computeResources
 * @returns {import('@vates/types').VmwareInventory}
 */
export function buildInventory({
  about,
  datacenters,
  clusters,
  hosts,
  datastores,
  networks,
  portgroups,
  vms,
  folders,
  computeResources,
}) {
  /** @type {Map<string, string | undefined>} */
  const parents = new Map()
  for (const objects of [folders, computeResources, hosts]) {
    for (const [id, { parent }] of Object.entries(objects)) {
      parents.set(id, refOf(parent))
    }
  }
  const datacenterIds = new Set(Object.keys(datacenters))

  /** @type {Record<string, string>} */
  const portgroupsByKey = {}
  for (const [id, { key }] of Object.entries(portgroups)) {
    // `key` comes from the SOAP response: same prototype-pollution guard as in `search`
    if (UNSAFE_KEYS.has(key)) {
      continue
    }
    portgroupsByKey[key] = id
  }

  return {
    product: about.name,
    version: about.version,
    instanceUuid: about.instanceUuid,
    datacenters: Object.entries(datacenters).map(([id, { name }]) => ({ id, name })),
    clusters: Object.entries(clusters).map(([id, { name, parent }]) => ({
      id,
      name,
      datacenter: findDatacenter(refOf(parent), parents, datacenterIds),
    })),
    hosts: Object.entries(hosts).map(([id, { name, parent }]) => ({
      id,
      name,
      parent: refOf(parent),
      datacenter: findDatacenter(id, parents, datacenterIds),
    })),
    datastores: Object.entries(datastores).map(([id, { summary, host }]) => ({
      id,
      name: summary?.name,
      type: summary?.type,
      capacity: toNumber(summary?.capacity),
      freeSpace: toNumber(summary?.freeSpace),
      hosts: [...reachingHostIds(host)],
    })),
    networks: Object.entries(networks).map(([id, { name }]) => {
      const portgroup = portgroups[id]
      return portgroup === undefined
        ? { id, name, distributed: false }
        : { id, name, distributed: true, vlan: parseVlan(portgroup['config.defaultPortConfig']) }
    }),
    vms: Object.entries(vms).map(([id, properties]) => {
      const { disks, nics } = parseDevices(properties['config.hardware.device'], portgroupsByKey)
      const snapshot = properties.snapshot
      const firmware = properties['config.firmware']
      const memoryMb = toNumber(properties['config.hardware.memoryMB'])
      return {
        id,
        name: properties['config.name'],
        annotation: properties['config.annotation'],
        instanceUuid: properties['config.instanceUuid'],
        firmware: firmware === 'efi' ? 'uefi' : firmware,
        secureBoot: isTrue(properties['config.bootOptions.efiSecureBootEnabled']),
        isTemplate: isTrue(properties['config.template']),
        cpus: toNumber(properties['config.hardware.numCPU']),
        memory: memoryMb === undefined ? undefined : memoryMb * 1024 * 1024,
        powerState: properties['runtime.powerState'],
        host: refOf(properties['runtime.host']),
        datastores: refsOf(properties.datastore),
        currentSnapshot: refOf(snapshot?.currentSnapshot),
        snapshotCount: countSnapshots(snapshot?.rootSnapshotList),
        disks,
        nics,
      }
    }),
  }
}
