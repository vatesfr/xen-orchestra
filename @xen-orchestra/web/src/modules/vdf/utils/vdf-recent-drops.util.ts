import type { VdfRuleLogEntry } from '@/modules/vdf/types.ts'

export type VdfRecentDrop = {
  key: string
  src: string
  dst: string
  // the VM whose policy decided: the destination, or for egress the source
  vm: string
  // dropped by the source's egress (vdf#53)
  egress: boolean
  proto: string
  port?: string
  tier: string
  policy: string
  rule: string
  count: number
  last: number
}

// What the rule log dropped lately, one row per flow (source, destination VM,
// service; for egress, source VM, destination and service) with the policy
// and rule that decided, most frequent first.
// Packets the agent didn't log (rate limit) count too.
export function recentDrops(
  entries: VdfRuleLogEntry[],
  { since, limit }: { since: number; limit?: number }
): VdfRecentDrop[] {
  const drops = new Map<string, VdfRecentDrop>()

  for (const entry of entries) {
    const at = Date.parse(entry.time)

    if (entry.verdict !== 'DROP' || !entry.vm || !(at >= since)) {
      continue
    }

    const proto = entry.proto.split(' ')[0].toLowerCase()
    const port = entry.dport || undefined
    const egress = entry.egress === true
    // an egress drop's destination is anywhere: by address
    const key = egress
      ? `${entry.vm}>${entry.dst}:${proto}/${port ?? ''}:out`
      : `${entry.src}>${entry.vm}:${proto}/${port ?? ''}`
    const count = 1 + (entry.suppressed ?? 0)
    const drop = drops.get(key)

    if (drop === undefined) {
      drops.set(key, {
        key,
        src: entry.src,
        dst: entry.dst,
        vm: entry.vm,
        egress,
        proto,
        port,
        tier: entry.tier,
        policy: entry.policy,
        rule: entry.rule,
        count,
        last: at,
      })
    } else {
      drop.count += count

      // the latest decision wins: a publish may have changed it
      if (at >= drop.last) {
        drop.last = at
        drop.tier = entry.tier
        drop.policy = entry.policy
        drop.rule = entry.rule
      }
    }
  }

  const sorted = [...drops.values()].sort((dropA, dropB) => dropB.count - dropA.count || dropB.last - dropA.last)

  return limit === undefined ? sorted : sorted.slice(0, limit)
}
