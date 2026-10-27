import { lockCall } from '@/modules/vdf/jobs/vdf-lock.job.ts'
import type { VdfHostLocking, VdfHostStatusDocument } from '@/modules/vdf/types.ts'
import {
  canonicalAddress,
  eui64InterfaceId,
  isAllowed,
  isEnforcedLock,
  isStableIpv6,
  lockDrift,
  lockErrorKind,
  lockProposal,
  lockRelevant,
  mergeLocking,
  parseAddressList,
  parseIpv6,
  reportedAddresses,
  untrustedInPolicy,
  type VdfLockHost,
  vdfLockUnavailable,
  vifLock,
} from '@/modules/vdf/utils/vdf-locking.util.ts'
import { interfaceAddresses } from '@/modules/vdf/utils/vdf-networks.util.ts'
import { hostState } from '@/modules/vdf/utils/vdf-status.util.ts'
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

describe('stable IPv6', () => {
  it('derives the modified EUI-64 of a MAC, universal/local bit flipped', () => {
    // locally administered (0x02 set): flipped off
    expect(eui64InterfaceId('8e:f1:9f:5d:4e:94')).toBe(0x8cf1_9fff_fe5d_4e94n)
    // universally administered: flipped on
    expect(eui64InterfaceId('00:16:3E:01:02:03')).toBe(0x0216_3eff_fe01_0203n)
    expect(eui64InterfaceId('02-00-00-00-00-05')).toBe(0x0000_00ff_fe00_0005n)
    expect(eui64InterfaceId('8e:f1:9f:5d:4e')).toBeUndefined()
    expect(eui64InterfaceId(undefined)).toBeUndefined()
  })

  it("tells a VIF's stable addresses from its temporary ones", () => {
    const mac = '8e:f1:9f:5d:4e:94'

    expect(isStableIpv6('2a01:cb15:81d2:9e00:8cf1:9fff:fe5d:4e94', mac)).toBe(true)
    expect(isStableIpv6('fda6:a4e8:32fb:c90d:8cf1:9fff:fe5d:4e94', mac)).toBe(true)
    // the bit not flipped, a privacy address, IPv4, no MAC
    expect(isStableIpv6('2a01:cb15:81d2:9e00:8ef1:9fff:fe5d:4e94', mac)).toBe(false)
    expect(isStableIpv6('2a01:cb15:81d2:9e00:3396:135c:e498:8b12', mac)).toBe(false)
    expect(isStableIpv6('10.0.0.5', mac)).toBe(false)
    expect(isStableIpv6('2a01:cb15:81d2:9e00:8cf1:9fff:fe5d:4e94', undefined)).toBe(false)
    expect(
      lockProposal(
        ['10.0.0.5', '2a01:cb15:81d2:9e00:8cf1:9fff:fe5d:4e94', '2a01:cb15:81d2:9e00:3396:135c:e498:8b12'],
        mac
      )
    ).toEqual({
      addresses: ['10.0.0.5', '2a01:cb15:81d2:9e00:8cf1:9fff:fe5d:4e94'],
      optional: ['2a01:cb15:81d2:9e00:3396:135c:e498:8b12'],
    })
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
      outside: ['10.0.0.5'],
      // no MAC known: no IPv6 address is stable
      proposal: { addresses: ['10.0.0.5'], optional: ['2001:db8::5'] },
    })
    // locked to IPv4 only: its IPv6 addresses aren't a change, nor proposed
    expect(lockDrift(locked(['10.0.0.5']), guest)).toBeUndefined()
    expect(lockDrift(locked(['10.0.0.4']), guest)).toMatchObject({
      reported: ['10.0.0.5'],
      proposal: { addresses: ['10.0.0.5'], optional: [] },
    })
    // IPv6 set by hand (none stable): every IPv6 counts
    expect(lockDrift(locked([], ['2001:db8::4']), guest)?.outside).toEqual(['2001:db8::5'])
    // locked to nothing: cut off, whatever it reports
    expect(lockDrift(locked([]), guest)?.reported).toEqual(['10.0.0.5', '2001:db8::5'])
    // nothing reported (halted, no tools), or not locked: nothing to say
    expect(lockDrift(locked(['10.0.0.4']), {})).toBeUndefined()
    expect(lockDrift(unlocked, guest)).toBeUndefined()
  })

  it('expects the stable IPv6 addresses of a lock holding some, not the temporary ones', () => {
    const mac = '8e:f1:9f:5d:4e:94'
    const stable = '2a01:cb15:81d2:9e00:8cf1:9fff:fe5d:4e94'
    const temporary = '2a01:cb15:81d2:9e00:3396:135c:e498:8b12'
    const reported = { '0/ipv4/0': '10.0.0.5', '0/ipv6/0': stable, '0/ipv6/1': temporary, '0/ipv6/2': 'fe80::1' }
    const vif = (ipv6: string[]) => ({
      device: '0',
      MAC: mac,
      lockingMode: 'locked',
      allowedIpv4Addresses: ['10.0.0.5'],
      allowedIpv6Addresses: ipv6,
    })

    // the temporary address rotated: not a change
    expect(lockDrift(vif([stable]), reported)).toBeUndefined()
    // a new prefix: its stable address is
    const renumbered = { ...reported, '0/ipv6/0': '2a01:cb15:81d2:9e01:8cf1:9fff:fe5d:4e94' }
    expect(lockDrift(vif([stable]), renumbered)).toMatchObject({
      outside: ['2a01:cb15:81d2:9e01:8cf1:9fff:fe5d:4e94'],
      proposal: { addresses: ['10.0.0.5', '2a01:cb15:81d2:9e01:8cf1:9fff:fe5d:4e94'], optional: [temporary] },
    })
    // IPv6 set by hand: the temporary address counts
    expect(lockDrift(vif(['2a01:cb15:81d2:9e00::10']), reported)?.outside).toEqual([temporary, stable])
    expect(lockRelevant([stable, temporary], [], [stable], mac)).toEqual([stable])
    expect(lockRelevant([stable, temporary], ['10.0.0.5'], [], mac)).toEqual([])
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

describe('lockErrorKind', () => {
  it("tells XAPI's refusal under an SDN controller from other errors", () => {
    expect(lockErrorKind('OPERATION_NOT_ALLOWED(A vswitch controller is active)')).toEqual({
      kind: 'sdn-controller',
      detail: 'A vswitch controller is active',
    })
    expect(lockErrorKind('OPERATION_NOT_ALLOWED(something else)')?.kind).toBe('not-allowed')
    expect(lockErrorKind('HANDLE_INVALID(VIF, OpaqueRef:1)')?.kind).toBe('gone')
    expect(lockErrorKind('no such VIF', 404)?.kind).toBe('gone')
    expect(lockErrorKind('not enough permissions', 403)?.kind).toBe('permission')
    expect(lockErrorKind('INVALID_IP_ADDRESS_SPECIFIED(10.0.0.300)')).toEqual({ kind: 'invalid', detail: '10.0.0.300' })
    expect(lockErrorKind('something unexpected', 500)).toBeUndefined()
  })
})

describe('untrustedInPolicy', () => {
  it('counts its VMs and its rules peers, not any', () => {
    const untrusted: Record<string, string[]> = { web: ['web-1'], app: ['app-1', 'web-1'], db: ['db-1'] }

    expect(
      untrustedInPolicy(
        {
          appliedTo: 'web',
          ingress: [
            { id: 1, from: 'app', proto: 'tcp' },
            { id: 2, from: 'any', proto: 'tcp' },
          ],
          egress: [{ id: 3, to: 'db', proto: 'tcp' }],
        },
        group => untrusted[group] ?? []
      )
    ).toEqual(['app-1', 'db-1', 'web-1'])
  })

  it('leaves its own VMs out for peersOnly', () => {
    const untrusted: Record<string, string[]> = { web: ['web-1'], app: ['app-1'] }

    expect(
      untrustedInPolicy(
        { appliedTo: 'web', ingress: [{ id: 1, from: 'app', proto: 'tcp' }] },
        group => untrusted[group] ?? [],
        { peersOnly: true }
      )
    ).toEqual(['app-1'])
  })
})

// vdf#41: where XAPI refuses to lock (an SDN controller is registered), VDF
// enforces the allowed addresses of a VIF with other_config vdf:locking
describe('VDF lock', () => {
  const NOW = Date.parse('2026-10-27T12:00:00Z')
  const SUPPORTING: VdfHostLocking = {
    unlocked: 0,
    stale: 0,
    vdfLock: true,
    vdfLocked: 1,
    vdfEnforced: ['vif-1'],
    vdfUnenforced: [],
  }
  // a host as XO reads it: its agent's status, and the state the usual
  // staleness rule gives (a heartbeat older than twice its period); null:
  // an agent before locking reports
  const host = (
    locking: VdfHostLocking | null = SUPPORTING,
    { heartbeat = '2026-10-27T11:59:30Z', live = true }: { heartbeat?: string; live?: boolean } = {}
  ): VdfLockHost => {
    const status: VdfHostStatusDocument = { heartbeat, heartbeatSec: 30, locking: locking ?? undefined }

    return { status, state: hostState(status, '', { live, now: NOW }) }
  }
  const withLocking = (fields: Record<string, unknown>) => host({ ...SUPPORTING, ...fields } as VdfHostLocking)
  const vif = (fields: Record<string, unknown> = {}) => ({
    id: 'vif-1',
    device: '0',
    lockingMode: 'network_default',
    allowedIpv4Addresses: ['10.0.0.5'],
    allowedIpv6Addresses: [],
    other_config: { 'vdf:locking': 'locked' },
    ...fields,
  })
  const running = (lockHost: VdfLockHost | undefined) => ({ running: true, host: lockHost })

  it('shows Locked (XAPI), Locked by VDF, not (yet) enforced, Unlocked', () => {
    expect(vifLock(vif({ lockingMode: 'locked', other_config: {} }), false, running(undefined))).toMatchObject({
      lock: 'xapi',
      untrusted: false,
    })
    expect(vifLock(vif(), false, running(host()))).toMatchObject({ lock: 'vdf', untrusted: false })
    expect(vifLock(vif(), false, running(host(null)))).toMatchObject({ lock: 'vdf-unenforced', reason: 'old-agent' })
    expect(vifLock(vif({ other_config: {} }), false, running(host()))).toMatchObject({
      lock: 'unlocked',
      untrusted: true,
    })
    expect(vifLock(vif({ lockingMode: 'unlocked' }), false, running(host())).lock).toBe('vdf')
    // XAPI's own lock comes first; disabled sends nothing
    expect(vifLock(vif({ lockingMode: 'locked' }), false, running(undefined)).lock).toBe('xapi')
    expect(vifLock(vif({ lockingMode: 'disabled' }), false, running(host()))).toMatchObject({
      lock: 'disabled',
      untrusted: false,
    })
    expect(vifLock(vif(), true, running(host())).lock).toBe('disabled')
    // a halted VM sends nothing: its lock applies on the host it starts on
    expect(vifLock(vif(), false, { running: false, host: undefined }).lock).toBe('vdf')
  })

  it('trusts a VDF lock only while every condition holds, the VIF listed as enforced', () => {
    const trusted = (lockVif: ReturnType<typeof vif>, lockHost: VdfLockHost | undefined) =>
      !vifLock(lockVif, false, running(lockHost)).untrusted
    const reason = (lockHost: VdfLockHost | undefined) => vifLock(vif(), false, running(lockHost)).reason

    expect(trusted(vif(), host())).toBe(true)
    // the key: absent, or not "locked"
    expect(trusted(vif({ other_config: {} }), host())).toBe(false)
    expect(trusted(vif({ other_config: { 'vdf:locking': 'on' } }), host())).toBe(false)
    // the VM's host: unknown, no status, a stale heartbeat, one from the
    // future, halted
    expect(reason(undefined)).toBe('agent')
    expect(trusted(vif(), { status: undefined, state: 'unknown' })).toBe(false)
    expect(trusted(vif(), host(SUPPORTING, { heartbeat: '2026-10-27T11:58:59Z' }))).toBe(false)
    expect(trusted(vif(), host(SUPPORTING, { heartbeat: '2026-10-27T11:59:01Z' }))).toBe(true)
    expect(trusted(vif(), host(SUPPORTING, { heartbeat: '2026-10-27T12:01:30Z' }))).toBe(false)
    expect(trusted(vif(), host(SUPPORTING, { heartbeat: '2026-10-27T12:00:30Z' }))).toBe(true)
    expect(trusted(vif(), host(SUPPORTING, { live: false }))).toBe(false)
    // an agent before VDF locks
    expect(trusted(vif(), host({ unlocked: 1, stale: 0 }))).toBe(false)
    // not listed as enforced: not yet, or the agent says it can't
    expect(reason(withLocking({ vdfEnforced: ['vif-2'] }))).toBe('pending')
    expect(reason(withLocking({ vdfEnforced: [], vdfUnenforced: ['vif-1'] }))).toBe('reported')
    // no list of those it enforces: an agent too old to vouch for one
    expect(reason(withLocking({ vdfEnforced: undefined }))).toBe('old-agent')
    expect(reason(withLocking({ vdfEnforced: 'vif-1' }))).toBe('old-agent')
    expect(reason(withLocking({ vdfEnforced: [], vdfUnenforced: 'vif-1' }))).toBe('pending')
    // a clean stop says so at once; no heartbeat period
    const stopping = host()
    stopping.status!.stopping = '2026-10-27T11:59:40Z'
    expect(reason({ ...stopping, state: hostState(stopping.status, '', { now: NOW }) })).toBe('agent')
    expect(reason({ ...host(), status: { ...host().status, heartbeatSec: undefined } })).toBe('agent')
    expect(reason({ ...host(), status: { ...host().status, heartbeatSec: 0 } })).toBe('agent')
  })

  it('a lock to a prefix is untrusted, XAPI or VDF', () => {
    const prefixed = { allowedIpv4Addresses: ['10.0.0.5', '10.0.0.0/8'] }

    expect(vifLock(vif({ lockingMode: 'locked', ...prefixed }), false, running(undefined))).toMatchObject({
      lock: 'xapi',
      prefix: true,
      untrusted: true,
    })
    expect(vifLock(vif(prefixed), false, running(host()))).toMatchObject({ lock: 'vdf', untrusted: true })
    expect(vifLock(vif({ allowedIpv6Addresses: ['fd00::/64'] }), false, running(host())).untrusted).toBe(true)
  })

  it("counts the allowed addresses of an enforced lock, the guest's otherwise", () => {
    const guestAddresses = { '0/ipv4/0': '10.0.0.5', '0/ipv4/1': '10.0.0.99' }
    const addresses = (lockHost: VdfLockHost) =>
      interfaceAddresses(vif(), guestAddresses, {
        locked: isEnforcedLock(vifLock(vif(), false, running(lockHost)).lock),
      })

    expect(addresses(host())).toEqual(['10.0.0.5'])
    expect(addresses(host(null))).toEqual(['10.0.0.5', '10.0.0.99'])
    expect(addresses(withLocking({ vdfEnforced: [] }))).toEqual(['10.0.0.5', '10.0.0.99'])
  })

  it("is offered where the agent of the VM's host supports it", () => {
    const old = host({ unlocked: 0, stale: 0 })
    const stopped = host(SUPPORTING, { heartbeat: '2026-10-27T11:00:00Z' })

    expect(vdfLockUnavailable({ running: true, host: host(), poolHosts: [] })).toBeUndefined()
    expect(vdfLockUnavailable({ running: true, host: old, poolHosts: [] })).toBe('old-agent')
    expect(vdfLockUnavailable({ running: true, host: stopped, poolHosts: [] })).toBe('agent')
    expect(vdfLockUnavailable({ running: true, host: undefined, poolHosts: [host()] })).toBe('agent')
    expect(vdfLockUnavailable({ running: true, host: withLocking({ vdfEnforced: undefined }), poolHosts: [] })).toBe(
      'old-agent'
    )
    const stopping = host()
    stopping.status!.stopping = '2026-10-27T11:59:40Z'
    stopping.state = hostState(stopping.status, '', { now: NOW })
    expect(vdfLockUnavailable({ running: true, host: stopping, poolHosts: [] })).toBe('agent')
    // a halted VM: every host with a running agent, one at least
    expect(vdfLockUnavailable({ running: false, host: undefined, poolHosts: [host(), stopped] })).toBeUndefined()
    expect(vdfLockUnavailable({ running: false, host: undefined, poolHosts: [host(), old] })).toBe('old-agent')
    expect(vdfLockUnavailable({ running: false, host: undefined, poolHosts: [stopped] })).toBe('agent')
  })

  it('flags a VDF lock its guest moved away from, not a disabled interface', () => {
    const guestAddresses = { '0/ipv4/0': '10.0.0.6' }

    expect(lockDrift(vif(), guestAddresses)?.outside).toEqual(['10.0.0.6'])
    expect(lockDrift(vif({ other_config: {} }), guestAddresses)).toBeUndefined()
    expect(lockDrift(vif({ lockingMode: 'disabled' }), guestAddresses)).toBeUndefined()
    // network_default on a network whose default is disabled
    expect(lockDrift(vif(), guestAddresses, true)).toBeUndefined()
    expect(lockDrift(vif({ lockingMode: 'locked' }), guestAddresses, true)?.outside).toEqual(['10.0.0.6'])
  })

  it('locks with XAPI first, with VDF once offered', () => {
    const request = { vifId: 'vif-1', ipv4: ['10.0.0.5'], ipv6: ['2001:db8::5'] }

    expect(lockCall(request)).toEqual({
      method: 'patch',
      endpoint: 'vifs/vif-1',
      body: { lockingMode: 'locked', allowedIpv4Addresses: ['10.0.0.5'], allowedIpv6Addresses: ['2001:db8::5'] },
    })
    // XAPI refuses to set the mode, even to locked, under an SDN controller:
    // a relock of a XAPI lock leaves it alone
    expect(lockCall({ ...request, xapiLocked: true }).body).not.toHaveProperty('lockingMode')
    // the refusal, then the VDF lock: the plugin's own path, no locking mode
    expect(lockErrorKind('OPERATION_NOT_ALLOWED(A vswitch controller is active)', 500)?.kind).toBe('sdn-controller')
    expect(lockCall({ ...request, withVdf: true })).toEqual({
      method: 'post',
      endpoint: 'plugins/vdf/vifs/vif-1/actions/vdf_lock',
      body: { ipv4: ['10.0.0.5'], ipv6: ['2001:db8::5'] },
    })
  })
})
