import type { VdfHostStatusDocument } from '@/modules/vdf/types.ts'
import {
  canonicalAddress,
  isAllowed,
  lockDrift,
  mergeLocking,
  parseAddressList,
  parseIpv6,
  reportedAddresses,
} from '@/modules/vdf/utils/vdf-locking.util.ts'
import { describe, expect, it } from 'vitest'

const guest = {
  '0/ipv4/0': '10.0.0.5',
  '0/ipv6/0': 'fe80::1',
  '0/ipv6/1': '2001:DB8:0:0:0:0:0:5',
  '1/ipv4/0': '10.0.1.5',
}

describe('addresses', () => {
  it('reads IPv4 and IPv6, as agents write them', () => {
    expect(canonicalAddress('192.168.1.10')).toEqual({ family: 4, address: '192.168.1.10' })
    expect(canonicalAddress('2001:0db8:0000:0000:0000:0000:0000:0001')).toEqual({ family: 6, address: '2001:db8::1' })
    expect(canonicalAddress('2001:db8:0:1:0:0:0:1')?.address).toBe('2001:db8:0:1::1')
    expect(canonicalAddress('::ffff:10.0.0.1')?.address).toBe('::ffff:a00:1')
    expect(canonicalAddress('::')?.address).toBe('::')
    expect(parseIpv6('1:2:3:4:5:6:7:8')).toBeDefined()
    for (const bad of [
      '256.1.1.1',
      '10.0.0',
      '10.0.0.01',
      '1::2::3',
      '1:2:3:4:5:6:7:8:9',
      '1:2:3:4:5:6:7::8',
      'fe80::1%eth0',
      'host',
    ]) {
      expect(canonicalAddress(bad), bad).toBeUndefined()
    }
  })

  it('parses what the user typed, any separator, without duplicates', () => {
    expect(parseAddressList(' 10.0.0.5, 2001:db8::5;10.0.0.5  10.0.0.6\n bad ')).toEqual({
      ipv4: ['10.0.0.5', '10.0.0.6'],
      ipv6: ['2001:db8::5'],
      invalid: ['bad'],
    })
    expect(parseAddressList('  ')).toEqual({ ipv4: [], ipv6: [], invalid: [] })
  })

  it('checks an address against allowed addresses and prefixes', () => {
    expect(isAllowed('10.0.0.5', ['10.0.0.5'])).toBe(true)
    expect(isAllowed('10.0.0.6', ['10.0.0.5'])).toBe(false)
    expect(isAllowed('10.0.0.200', ['10.0.0.0/24'])).toBe(true)
    expect(isAllowed('10.0.1.1', ['10.0.0.0/24'])).toBe(false)
    expect(isAllowed('8.8.8.8', ['0.0.0.0/0'])).toBe(true)
    expect(isAllowed('2001:db8::5', ['2001:0db8::5'])).toBe(true)
    expect(isAllowed('2001:db8::1:5', ['2001:db8::/64'])).toBe(true)
    expect(isAllowed('2001:db9::5', ['2001:db8::/64'])).toBe(false)
    expect(isAllowed('10.0.0.5', ['2001:db8::/64'])).toBe(false)
  })
})

describe('locking', () => {
  const unlocked = { device: '0', lockingMode: 'network_default' }

  it('proposes what the guest reports for the device, link-local left out', () => {
    expect(reportedAddresses(unlocked, guest)).toEqual(['10.0.0.5', '2001:db8::5'])
    // a locked VIF's: what the guest reports, not its allowed list
    expect(
      reportedAddresses({ ...unlocked, lockingMode: 'locked', allowedIpv4Addresses: ['10.0.0.9'] }, guest)
    ).toEqual(['10.0.0.5', '2001:db8::5'])
    expect(reportedAddresses({ device: '2', lockingMode: 'unlocked' }, guest)).toEqual([])
  })

  it('flags a lock the guest moved away from', () => {
    const locked = (ipv4: string[], ipv6: string[] = []) => ({
      device: '0',
      lockingMode: 'locked',
      allowedIpv4Addresses: ipv4,
      allowedIpv6Addresses: ipv6,
    })

    expect(lockDrift(locked(['10.0.0.5'], ['2001:db8::5']), guest)).toBeUndefined()
    expect(lockDrift(locked(['10.0.0.0/24'], ['2001:db8::/64']), guest)).toBeUndefined()
    expect(lockDrift(locked(['10.0.0.4'], ['2001:db8::5']), guest)).toEqual({
      allowed: ['10.0.0.4', '2001:db8::5'],
      reported: ['10.0.0.5', '2001:db8::5'],
    })
    // locked to IPv4 only: its IPv6 addresses aren't a change, nor proposed
    expect(lockDrift(locked(['10.0.0.5']), guest)).toBeUndefined()
    expect(lockDrift(locked(['10.0.0.4']), guest)).toEqual({ allowed: ['10.0.0.4'], reported: ['10.0.0.5'] })
    expect(lockDrift(locked([], ['2001:db8::4']), guest)?.reported).toEqual(['2001:db8::5'])
    // locked to nothing: cut off, whatever it reports
    expect(lockDrift(locked([]), guest)?.reported).toEqual(['10.0.0.5', '2001:db8::5'])
    // nothing reported (halted, no tools), or not locked: nothing to say
    expect(lockDrift(locked(['10.0.0.4']), {})).toBeUndefined()
    expect(lockDrift(unlocked, guest)).toBeUndefined()
  })

  it("merges the hosts' reports, older and stopped agents apart", () => {
    const vif = (vmName: string, device = '0') => ({ vm: vmName, vmName, vif: `vif-${vmName}`, device, network: 'n' })
    const status = (locking?: VdfHostStatusDocument['locking']): VdfHostStatusDocument => ({ locking })
    const report = mergeLocking([
      {
        hostId: 'h1',
        status: status({ unlocked: 22, unlockedVifs: [vif('web'), vif('app', '1')], stale: 0 }),
        current: true,
      },
      {
        hostId: 'h2',
        status: status({ unlocked: 1, unlockedVifs: [vif('app', '0')], stale: 1, staleVifs: [vif('db')] }),
        current: true,
      },
      { hostId: 'h3', status: status(), current: true },
      { hostId: 'h4', status: status({ unlocked: 5, stale: 0 }), current: false },
      { hostId: 'h5', status: undefined, current: true },
    ])

    expect([...report.reportingHostIds]).toEqual(['h1', 'h2'])
    expect(report.unlockedCount).toBe(23)
    expect(report.unlocked.map(entry => `${entry.vmName}/${entry.device}`)).toEqual(['app/0', 'app/1', 'web/0'])
    expect(report.staleCount).toBe(1)
    expect(report.stale[0].vmName).toBe('db')
  })
})
