import { getV2vAddress, getV2vSourceId, isV2vVcenter, normalizeV2vHost } from '@/modules/v2v/utils/v2v-source.util.ts'

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

describe('isV2vVcenter', () => {
  it('recognizes a vCenter product', () => {
    expect(isV2vVcenter('VMware vCenter Server')).toBe(true)
  })

  it.each(['VMware ESXi', undefined, '', 'Hyper-V'])('is false for any other product (%j)', product => {
    expect(isV2vVcenter(product)).toBe(false)
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
