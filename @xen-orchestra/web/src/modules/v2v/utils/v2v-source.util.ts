import type { XoV2vConnection, XoV2vInventory, XoV2vVm } from '@vates/types'

export const V2V_DEFAULT_PORT = 443

export function normalizeV2vHost(host: string): string {
  return host.trim().toLowerCase()
}

export function getV2vAddress({ host, port }: Pick<XoV2vConnection, 'host' | 'port'>): `${string}:${number}` {
  return `${normalizeV2vHost(host)}:${port}`
}

export function isV2vVcenter(product: string | undefined): boolean {
  return product !== undefined && /vcenter/i.test(product)
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

export function getV2vVmDatacenterName(
  inventory: Pick<XoV2vInventory, 'hosts' | 'datacenters'>,
  vm: Pick<XoV2vVm, 'hostId'>
): string | undefined {
  const datacenterId = inventory.hosts.find(host => host.id === vm.hostId)?.datacenterId

  return inventory.datacenters.find(datacenter => datacenter.id === datacenterId)?.name
}
