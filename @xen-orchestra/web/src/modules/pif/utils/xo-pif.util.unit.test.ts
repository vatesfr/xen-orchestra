import {
  getHostIpAddresses,
  getPifIpAddresses,
  getPifsIpAddresses,
  getPifStatus,
} from '@/modules/pif/utils/xo-pif.util.ts'
import { createPif } from '@/test/create-pif.ts'
import { CONNECTION_STATUS } from '@core/types/connection.ts'

describe('getPifStatus', () => {
  it('reports a disconnected status when the PIF is not attached, whatever its carrier', () => {
    expect(getPifStatus(createPif({ attached: false, carrier: true }))).toBe(CONNECTION_STATUS.DISCONNECTED)
    expect(getPifStatus(createPif({ attached: false, carrier: false }))).toBe(CONNECTION_STATUS.DISCONNECTED)
  })

  it('reports a disconnection from the physical device when an attached PIF has no carrier', () => {
    expect(getPifStatus(createPif({ attached: true, carrier: false }))).toBe(
      CONNECTION_STATUS.DISCONNECTED_FROM_PHYSICAL_DEVICE
    )
  })

  it('reports a connected status when the PIF is attached and has a carrier', () => {
    expect(getPifStatus(createPif({ attached: true, carrier: true }))).toBe(CONNECTION_STATUS.CONNECTED)
  })
})

describe('getPifIpAddresses', () => {
  it('lists the IPv4 address of the PIF before its IPv6 ones', () => {
    const pif = createPif({ ip: '10.0.0.1', ipv6: ['2001:db8::1', '2001:db8::2'] })

    expect(getPifIpAddresses(pif)).toEqual(['10.0.0.1', '2001:db8::1', '2001:db8::2'])
  })

  it('keeps only the non-empty addresses', () => {
    const pif = createPif({ ip: '', ipv6: ['', '2001:db8::1'] })

    expect(getPifIpAddresses(pif)).toEqual(['2001:db8::1'])
  })

  it('returns an empty array when the PIF reports no address', () => {
    expect(getPifIpAddresses(createPif({ ip: '', ipv6: [] }))).toEqual([])
  })
})

describe('getPifsIpAddresses', () => {
  it('collects the addresses of every PIF, in order', () => {
    const pifs = [
      createPif({ ip: '10.0.0.1', ipv6: ['2001:db8::1'] }),
      createPif({ ip: '10.0.0.2', ipv6: ['2001:db8::2'] }),
    ]

    expect(getPifsIpAddresses(pifs)).toEqual(['10.0.0.1', '2001:db8::1', '10.0.0.2', '2001:db8::2'])
  })

  it('ignores a PIF that reports no address at all', () => {
    const pifs = [createPif({ ip: '', ipv6: [] }), createPif({ ip: '10.0.0.1', ipv6: [] })]

    expect(getPifsIpAddresses(pifs)).toEqual(['10.0.0.1'])
  })

  it('returns an empty array when there is no PIF', () => {
    expect(getPifsIpAddresses([])).toEqual([])
  })

  it('returns an empty array when the PIFs are unknown', () => {
    expect(getPifsIpAddresses(undefined)).toEqual([])
  })
})

describe('getHostIpAddresses', () => {
  it('lists the management IP of the host before the addresses of its PIFs', () => {
    const pifs = [createPif({ ip: '10.0.0.2', ipv6: ['2001:db8::1'] })]

    expect(getHostIpAddresses('10.0.0.1', pifs)).toEqual(['10.0.0.1', '10.0.0.2', '2001:db8::1'])
  })

  it('does not repeat the management IP when a PIF reports it too', () => {
    const pifs = [createPif({ ip: '10.0.0.1', ipv6: [] }), createPif({ ip: '10.0.0.2', ipv6: [] })]

    expect(getHostIpAddresses('10.0.0.1', pifs)).toEqual(['10.0.0.1', '10.0.0.2'])
  })

  it('lists only the addresses of the PIFs when the host reports no management IP', () => {
    const pifs = [createPif({ ip: '10.0.0.2', ipv6: [] })]

    expect(getHostIpAddresses('', pifs)).toEqual(['10.0.0.2'])
  })

  it('lists the management IP alone when the host has no PIF', () => {
    expect(getHostIpAddresses('10.0.0.1', undefined)).toEqual(['10.0.0.1'])
  })

  it('returns an empty array when the host reports neither a management IP nor a PIF', () => {
    expect(getHostIpAddresses('', undefined)).toEqual([])
  })
})
