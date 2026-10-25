import type { VdfHostLocking, VdfHostStatusDocument, VdfLockedVif } from '@/modules/vdf/types.ts'
import { interfaceAddresses, type VdfInterfaceVif } from '@/modules/vdf/utils/vdf-networks.util.ts'

// VIF LOCKING (vdf#15): a locked VIF can only send from its allowed
// addresses (XAPI drops the rest), so the firewall can trust them. XO locks
// an interface to the addresses its guest reports, after a confirmation
// where they can be edited, and flags a lock its guest moved away from (a
// new DHCP lease: its traffic from the new address is dropped).

const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/

export function parseIpv4(text: string): number | undefined {
  if (!IPV4.test(text)) {
    return undefined
  }

  return text.split('.').reduce((value, part) => value * 256 + Number(part), 0)
}

// an IPv6 address as a 128-bit number (embedded IPv4 accepted, zone not)
export function parseIpv6(text: string): bigint | undefined {
  if (!/^[0-9a-f:.]+$/i.test(text) || !text.includes(':')) {
    return undefined
  }

  let groups = text
  const tail = /:(\d+\.\d+\.\d+\.\d+)$/.exec(text)

  if (tail !== null) {
    const v4 = parseIpv4(tail[1])

    if (v4 === undefined) {
      return undefined
    }

    groups = `${text.slice(0, tail.index)}:${(v4 >>> 16).toString(16)}:${(v4 & 0xffff).toString(16)}`
  }

  const halves = groups.split('::')

  if (halves.length > 2) {
    return undefined
  }

  const head = halves[0] === '' ? [] : halves[0].split(':')
  const rest = halves.length === 2 ? (halves[1] === '' ? [] : halves[1].split(':')) : []
  const missing = 8 - head.length - rest.length

  if (halves.length === 1 ? head.length !== 8 : missing < 1) {
    return undefined
  }

  const all = [...head, ...Array<string>(halves.length === 2 ? missing : 0).fill('0'), ...rest]

  if (all.some(group => !/^[0-9a-f]{1,4}$/i.test(group))) {
    return undefined
  }

  return all.reduce((value, group) => (value << 16n) | BigInt(parseInt(group, 16)), 0n)
}

// RFC 5952: lower case, the longest run of zero groups (two or more) as ::
function formatIpv6(value: bigint) {
  const groups = Array.from({ length: 8 }, (_, index) => Number((value >> BigInt(112 - 16 * index)) & 0xffffn))
  let best = { start: -1, length: 1 }

  for (let start = 0; start < 8; start++) {
    let length = 0

    while (start + length < 8 && groups[start + length] === 0) {
      length++
    }

    if (length > best.length) {
      best = { start, length }
    }
  }

  const hex = groups.map(group => group.toString(16))

  if (best.start === -1) {
    return hex.join(':')
  }

  return `${hex.slice(0, best.start).join(':')}::${hex.slice(best.start + best.length).join(':')}`
}

// an address as XAPI and agents write it, or undefined
export function canonicalAddress(text: string): { family: 4 | 6; address: string } | undefined {
  if (parseIpv4(text) !== undefined) {
    return { family: 4, address: text }
  }

  const v6 = parseIpv6(text)

  return v6 === undefined ? undefined : { family: 6, address: formatIpv6(v6) }
}

// what the user typed in a lock confirmation: addresses separated by
// commas, semicolons or spaces
export function parseAddressList(text: string) {
  const ipv4: string[] = []
  const ipv6: string[] = []
  const invalid: string[] = []

  for (const entry of text.split(/[\s,;]+/).filter(entry => entry !== '')) {
    const parsed = canonicalAddress(entry)

    if (parsed === undefined) {
      invalid.push(entry)
    } else {
      const list = parsed.family === 4 ? ipv4 : ipv6

      if (!list.includes(parsed.address)) {
        list.push(parsed.address)
      }
    }
  }

  return { ipv4, ipv6, invalid }
}

export const formatAddressList = (addresses: readonly string[]) => addresses.join(', ')

// an address is let through by a locked VIF's allowed entries (addresses,
// or prefixes as agents accept them)
export function isAllowed(ip: string, allowed: readonly string[]) {
  const v4 = parseIpv4(ip)
  const v6 = v4 === undefined ? parseIpv6(ip) : undefined

  if (v4 === undefined && v6 === undefined) {
    return true // not an address: nothing to say about it
  }

  return allowed.some(entry => {
    const [base, bits] = entry.split('/')
    const length = bits === undefined ? undefined : Number(bits)

    if (v4 !== undefined) {
      const net = parseIpv4(base)

      if (net === undefined || (length !== undefined && !(length >= 0 && length <= 32))) {
        return false
      }

      const shift = 32 - (length ?? 32)

      return shift === 32 || Math.floor(net / 2 ** shift) === Math.floor(v4 / 2 ** shift)
    }

    const net = parseIpv6(base)

    if (net === undefined || (length !== undefined && !(length >= 0 && length <= 128))) {
      return false
    }

    const shift = BigInt(128 - (length ?? 128))

    return net >> shift === v6! >> shift
  })
}

// what the guest reports for a VIF's device, whatever its locking: the
// addresses a lock proposes (IPv4 first, IPv6 link-local left out)
// (written as agents write them)
export const reportedAddresses = (vif: VdfInterfaceVif, guestAddresses: Record<string, string> | undefined) => [
  ...new Set(
    interfaceAddresses({ ...vif, lockingMode: 'unlocked' }, guestAddresses).map(
      ip => canonicalAddress(ip)?.address ?? ip
    )
  ),
]

// STABLE IPV6: SLAAC gives a VIF an address whose interface ID (its low 64
// bits) is the modified EUI-64 of its MAC, and keeps it. The guest's other
// IPv6 addresses (privacy, temporary or random) rotate: a lock to one cuts
// the VM's IPv6 off when it does.

// the modified EUI-64 interface ID of a MAC (RFC 4291, appendix A): FF:FE
// in the middle, the universal/local bit (0x02 of the first byte) flipped
export function eui64InterfaceId(mac: string | undefined): bigint | undefined {
  const bytes = mac?.split(/[:-]/) ?? []

  if (bytes.length !== 6 || bytes.some(byte => !/^[0-9a-f]{2}$/i.test(byte))) {
    return undefined
  }

  const [b0, b1, b2, b3, b4, b5] = bytes.map(byte => parseInt(byte, 16))

  return [b0 ^ 0x02, b1, b2, 0xff, 0xfe, b3, b4, b5].reduce((value, byte) => (value << 8n) | BigInt(byte), 0n)
}

// an IPv6 address whose interface ID is the MAC's EUI-64
export function isStableIpv6(ip: string, mac: string | undefined) {
  const value = parseIpv6(ip)
  const id = eui64InterfaceId(mac)

  return value !== undefined && id !== undefined && (value & 0xffff_ffff_ffff_ffffn) === id
}

export type VdfLockProposal = {
  // proposed: IPv4, and the stable IPv6 addresses
  addresses: string[]
  // the guest's other IPv6 addresses, offered unticked
  optional: string[]
}

export function lockProposal(reported: readonly string[], mac: string | undefined): VdfLockProposal {
  const isProposed = (ip: string) => !ip.includes(':') || isStableIpv6(ip, mac)

  return { addresses: reported.filter(isProposed), optional: reported.filter(ip => !isProposed(ip)) }
}

// A VIF as a lock sees it: its MAC tells its stable IPv6 addresses
export type VdfLockVif = VdfInterfaceVif & { MAC?: string }

export type VdfLockDrift = {
  // what the VIF is locked to
  allowed: string[]
  // what its guest reports now that the lock is expected to hold
  reported: string[]
  // those of them outside the lock: what it moved to
  outside: string[]
  // what a relock proposes: the guest's addresses in the families the
  // lock allows (all of them for a lock to nothing)
  proposal: VdfLockProposal
}

// The guest's addresses a lock is expected to hold: one missing from the
// allowed list means the guest changed address. The same rule as agents'
// (agent/status.go lockRelevant):
// - a lock to nothing cuts every address: all of them count;
// - IPv4 counts when the lock allows some IPv4, else it's off on purpose;
//   the same for IPv6: a lock with no IPv6 at all has IPv6 off, the
//   guest's IPv6 addresses aren't a change;
// - a lock holding stable IPv6 addresses expects those only: the guest's
//   temporary ones come and go, a new stable one (another prefix) counts;
// - a lock holding IPv6 addresses, none of them stable (set by hand,
//   static or DHCPv6), counts every IPv6 the guest reports.
export function lockRelevant(
  reported: readonly string[],
  ipv4: readonly string[],
  ipv6: readonly string[],
  mac: string | undefined
) {
  if (ipv4.length === 0 && ipv6.length === 0) {
    return [...reported]
  }

  const isStableLock = ipv6.some(ip => isStableIpv6(ip, mac))

  return reported.filter(ip =>
    ip.includes(':') ? ipv6.length > 0 && (!isStableLock || isStableIpv6(ip, mac)) : ipv4.length > 0
  )
}

// a locked VIF whose guest reports an address outside its allowed list:
// the guest changed address, XAPI drops its traffic from the new one
export function lockDrift(
  vif: VdfLockVif,
  guestAddresses: Record<string, string> | undefined
): VdfLockDrift | undefined {
  if (vif.lockingMode !== 'locked') {
    return undefined
  }

  const ipv4 = vif.allowedIpv4Addresses ?? []
  const ipv6 = vif.allowedIpv6Addresses ?? []
  const allowed = [...ipv4, ...ipv6]
  const all = reportedAddresses(vif, guestAddresses)
  const reported = lockRelevant(all, ipv4, ipv6, vif.MAC)
  const outside = reported.filter(ip => !isAllowed(ip, allowed))

  if (outside.length === 0) {
    return undefined
  }

  const isLockToNothing = allowed.length === 0
  const inFamilies = all.filter(ip => isLockToNothing || (ip.includes(':') ? ipv6.length > 0 : ipv4.length > 0))

  return { allowed, reported, outside, proposal: lockProposal(inFamilies, vif.MAC) }
}

export type VdfLockingReport = {
  // hosts whose agent reports locking (older agents don't)
  reportingHostIds: Set<string>
  unlocked: VdfLockedVif[]
  unlockedCount: number
  stale: VdfLockedVif[]
  staleCount: number
}

// the agents' locking reports of a pool's hosts, merged
export function mergeLocking(
  hosts: { hostId: string; status: VdfHostStatusDocument | undefined; current: boolean }[]
): VdfLockingReport {
  const report: VdfLockingReport = {
    reportingHostIds: new Set(),
    unlocked: [],
    unlockedCount: 0,
    stale: [],
    staleCount: 0,
  }

  for (const { hostId, status, current } of hosts) {
    const locking: VdfHostLocking | undefined = status?.locking

    // a stopped agent's report is outdated: the caller works it out
    if (!current || locking === undefined) {
      continue
    }

    report.reportingHostIds.add(hostId)
    report.unlocked.push(...(locking.unlockedVifs ?? []))
    report.unlockedCount += Math.max(locking.unlocked ?? 0, locking.unlockedVifs?.length ?? 0)
    report.stale.push(...(locking.staleVifs ?? []))
    report.staleCount += Math.max(locking.stale ?? 0, locking.staleVifs?.length ?? 0)
  }

  const byName = (vifA: VdfLockedVif, vifB: VdfLockedVif) =>
    vifA.vmName.localeCompare(vifB.vmName) || Number(vifA.device) - Number(vifB.device)

  report.unlocked.sort(byName)
  report.stale.sort(byName)

  return report
}
