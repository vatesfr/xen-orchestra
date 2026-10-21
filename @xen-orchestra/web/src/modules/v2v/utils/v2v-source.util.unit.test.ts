import {
  getV2vAddress,
  getV2vSourceId,
  getV2vSourceKind,
  getV2vVmDatacenterName,
  normalizeV2vHost,
} from '@/modules/v2v/utils/v2v-source.util.ts'
import { createV2vDatacenter, createV2vHost, createV2vInventory, createV2vVm } from '@/test/create-v2v-inventory.ts'

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
