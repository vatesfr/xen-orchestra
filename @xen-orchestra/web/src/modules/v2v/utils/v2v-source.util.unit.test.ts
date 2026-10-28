import {
  findV2vPortGroup,
  findV2vVmHost,
  getV2vAddress,
  getV2vDatastoreName,
  getV2vSourceId,
  getV2vSourceKind,
  getV2vVmDatacenterName,
  normalizeV2vHost,
} from '@/modules/v2v/utils/v2v-source.util.ts'
import {
  createV2vDatacenter,
  createV2vDatastore,
  createV2vHost,
  createV2vInventory,
  createV2vPortGroup,
  createV2vVm,
} from '@/test/create-v2v-inventory.ts'
import type { XoV2vDatastore, XoV2vHost, XoV2vPortGroup } from '@vates/types'

describe('normalizeV2vHost', () => {
  it('trims and lowercases the host', () => {
    expect(normalizeV2vHost('  VCenter.Lab ')).toBe('vcenter.lab')
  })
})

describe('getV2vAddress', () => {
  it('joins the normalized host and the port', () => {
    expect(getV2vAddress({ host: ' ESXi.Lab ', port: 8443 })).toBe(`${normalizeV2vHost(' ESXi.Lab ')}:8443`)
  })
})

describe('getV2vSourceKind', () => {
  it.each([
    ['VMware vCenter Server', 'vcenter'],
    ['VMware ESXi', 'esxi'],
  ])('reads %s as %s', (product, kind) => {
    expect(getV2vSourceKind(product)).toBe(kind)
  })

  it.each([undefined, '', 'Hyper-V'])('returns nothing for an unknown product (%j)', product => {
    expect(getV2vSourceKind(product)).toBeUndefined()
  })
})

describe('getV2vSourceId', () => {
  const connection = { host: 'ESXi.Lab', port: 443 }

  it('uses the vCenter instance UUID', () => {
    expect(getV2vSourceId(connection, 'vcenter-uuid-1')).toBe('vcenter-uuid-1')
  })

  it.each([undefined, ''])('falls back to the connection address without instance UUID (%j)', instanceUuid => {
    expect(getV2vSourceId(connection, instanceUuid)).toBe(getV2vAddress(connection))
  })
})

describe('findV2vVmHost', () => {
  const HOST = createV2vHost()

  const OTHER_HOST = createV2vHost({ id: 'host-other' as XoV2vHost['id'] })

  it('finds the host of the VM among the others', () => {
    const inventory = createV2vInventory({ hosts: [OTHER_HOST, HOST] })

    expect(findV2vVmHost(inventory, createV2vVm({ hostId: HOST.id }))).toBe(HOST)
  })

  it('finds no host for an unknown host', () => {
    const inventory = createV2vInventory({ hosts: [OTHER_HOST] })

    expect(findV2vVmHost(inventory, createV2vVm({ hostId: HOST.id }))).toBeUndefined()
  })
})

describe('getV2vVmDatacenterName', () => {
  const DATACENTER = createV2vDatacenter()

  const HOST = createV2vHost({ datacenterId: DATACENTER.id })

  const VM = createV2vVm({ hostId: HOST.id })

  it('names the datacenter of the host of the VM', () => {
    expect(getV2vVmDatacenterName(createV2vInventory({ hosts: [HOST], datacenters: [DATACENTER] }), VM)).toBe(
      DATACENTER.name
    )
  })

  it.each([
    ['an unknown host', { hosts: [], datacenters: [DATACENTER] }],
    ['a host of an unknown datacenter', { hosts: [HOST], datacenters: [] }],
  ])('names no datacenter for %s', (_, inventory) => {
    expect(getV2vVmDatacenterName(createV2vInventory(inventory), VM)).toBeUndefined()
  })
})

describe('getV2vDatastoreName', () => {
  const DATASTORE = createV2vDatastore()

  const UNKNOWN_DATASTORE_ID = 'datastore-unknown' as XoV2vDatastore['id']

  it('names the datastore after the inventory', () => {
    expect(getV2vDatastoreName(createV2vInventory({ datastores: [DATASTORE] }), DATASTORE.id)).toBe(DATASTORE.name)
  })

  it('names a datastore missing from the inventory by its id', () => {
    expect(getV2vDatastoreName(createV2vInventory({ datastores: [DATASTORE] }), UNKNOWN_DATASTORE_ID)).toBe(
      UNKNOWN_DATASTORE_ID
    )
  })

  it('names the datastore by its id without inventory', () => {
    expect(getV2vDatastoreName(undefined, DATASTORE.id)).toBe(DATASTORE.id)
  })
})

describe('findV2vPortGroup', () => {
  const PORT_GROUP = createV2vPortGroup()

  const OTHER_PORT_GROUP = createV2vPortGroup({ id: 'port-group-other' as XoV2vPortGroup['id'] })

  it('finds the port group among the others', () => {
    expect(findV2vPortGroup(createV2vInventory({ portGroups: [OTHER_PORT_GROUP, PORT_GROUP] }), PORT_GROUP.id)).toBe(
      PORT_GROUP
    )
  })

  it.each([
    ['an unknown port group', createV2vInventory({ portGroups: [OTHER_PORT_GROUP] })],
    ['no inventory', undefined],
  ])('finds no port group for %s', (_, inventory) => {
    expect(findV2vPortGroup(inventory, PORT_GROUP.id)).toBeUndefined()
  })
})
