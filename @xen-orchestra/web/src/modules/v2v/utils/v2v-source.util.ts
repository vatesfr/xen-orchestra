import type { XoV2vConnection, XoV2vDisk, XoV2vInventory, XoV2vNic, XoV2vVm } from '@vates/types'

export type V2vSourceKind = 'vcenter' | 'esxi'

export const V2V_DEFAULT_PORT = 443

export function normalizeV2vHost(host: string): string {
  return host.trim().toLowerCase()
}

export function getV2vAddress({ host, port }: Pick<XoV2vConnection, 'host' | 'port'>): `${string}:${number}` {
  return `${normalizeV2vHost(host)}:${port}`
}

export function getV2vSourceKind(product: string | undefined): V2vSourceKind | undefined {
  if (product === undefined) {
    return undefined
  }

  if (/vcenter/i.test(product)) {
    return 'vcenter'
  }

  return /esxi/i.test(product) ? 'esxi' : undefined
}

// A standalone ESXi has no instance UUID: its identity is the address it is reached at (spec, accepted limitation)
export function getV2vSourceId(
  connection: Pick<XoV2vConnection, 'host' | 'port'>,
  instanceUuid: string | undefined
): string {
  if (instanceUuid) {
    return instanceUuid
  }

  return getV2vAddress(connection)
}

// Without inventory (no source connected), a VM has no host to find
export function findV2vVmHost(inventory: Pick<XoV2vInventory, 'hosts'> | undefined, vm: Pick<XoV2vVm, 'hostId'>) {
  return inventory?.hosts.find(host => host.id === vm.hostId)
}

// Without inventory (no source connected) or missing from it, a datastore is named by its id rather than not at all
export function getV2vDatastoreName(
  inventory: Pick<XoV2vInventory, 'datastores'> | undefined,
  id: XoV2vDisk['datastoreId']
): string {
  return inventory?.datastores.find(datastore => datastore.id === id)?.name ?? id
}

export function findV2vPortGroup(
  inventory: Pick<XoV2vInventory, 'portGroups'> | undefined,
  id: XoV2vNic['portGroupId']
) {
  return inventory?.portGroups.find(portGroup => portGroup.id === id)
}

export function getV2vVmDatacenterName(
  inventory: Pick<XoV2vInventory, 'hosts' | 'datacenters'> | undefined,
  vm: Pick<XoV2vVm, 'hostId'>
): string | undefined {
  const datacenterId = findV2vVmHost(inventory, vm)?.datacenterId

  return inventory?.datacenters.find(datacenter => datacenter.id === datacenterId)?.name
}
