/**
 * Parses XO load-balancer VM tags.
 *
 * Tag format:
 *   xo:load:balancer:ignore                     → VM is excluded from all plans
 *   xo:load:balancer:affinity=<group>           → VM must be colocated with its group
 *   xo:load:balancer:anti-affinity=<group>      → VM must be spread from its group
 *
 * Rules:
 *   - A VM with the `ignore` tag is excluded from all constraints, regardless of other tags.
 *   - Group names are the literal string after the first `=`; they may contain `=` or spaces.
 *   - Unknown sub-keys (e.g. `xo:load:balancer:unknown`) are silently ignored.
 *   - An empty group name (e.g. `xo:load:balancer:affinity=`) is treated as unknown.
 */

const TAG_PREFIX = 'xo:load:balancer:'

// ─── Discriminated union types for a single parsed tag ───────────────────────

export type VmTagIgnore = { readonly type: 'ignore' }
export type VmTagAffinity = { readonly type: 'affinity'; readonly group: string }
export type VmTagAntiAffinity = { readonly type: 'anti-affinity'; readonly group: string }

export type VmTag = VmTagIgnore | VmTagAffinity | VmTagAntiAffinity

/**
 * Parse a single tag string.
 * Returns `undefined` for non-LB tags or unrecognised LB sub-keys.
 */
export function parseVmTag(tag: string): VmTag | undefined {
  if (!tag.startsWith(TAG_PREFIX)) {
    return undefined
  }

  const rest = tag.slice(TAG_PREFIX.length)

  if (rest === 'ignore') {
    return { type: 'ignore' }
  }

  // Split on the first `=` only — group names may contain `=`
  const eqIdx = rest.indexOf('=')
  if (eqIdx === -1) {
    return undefined
  }

  const key = rest.slice(0, eqIdx)
  const group = rest.slice(eqIdx + 1)

  // Empty group name is not valid
  if (group.length === 0) {
    return undefined
  }

  if (key === 'affinity') {
    return { type: 'affinity', group }
  }

  if (key === 'anti-affinity') {
    return { type: 'anti-affinity', group }
  }

  return undefined
}

// ─── VM-level config derived from the full tag list ──────────────────────────

export type VmLoadBalancerConfig =
  | { readonly ignored: true }
  | {
      readonly ignored: false
      readonly affinityGroups: ReadonlySet<string>
      readonly antiAffinityGroups: ReadonlySet<string>
    }

/**
 * Derive the complete load-balancer config for a VM from its tag list.
 *
 * If `xo:load:balancer:ignore` is present, returns `{ ignored: true }`
 * immediately — all other LB tags on the same VM are discarded.
 */
export function getVmConfig(tags: ReadonlyArray<string>): VmLoadBalancerConfig {
  const affinityGroups = new Set<string>()
  const antiAffinityGroups = new Set<string>()

  for (const tag of tags) {
    const parsed = parseVmTag(tag)
    if (parsed === undefined) {
      continue
    }

    if (parsed.type === 'ignore') {
      return { ignored: true }
    }

    if (parsed.type === 'affinity') {
      affinityGroups.add(parsed.group)
    } else {
      antiAffinityGroups.add(parsed.group)
    }
  }

  return { ignored: false, affinityGroups, antiAffinityGroups }
}
