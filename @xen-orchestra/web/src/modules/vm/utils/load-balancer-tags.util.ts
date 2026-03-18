const LOAD_BALANCER_TAG_PREFIX = 'xo:load:balancer:'

type ParsedLoadBalancerTag =
  | { type: 'ignore' }
  | { type: 'affinity'; group: string }
  | { type: 'anti-affinity'; group: string }

export function parseLoadBalancerTag(tag: string): ParsedLoadBalancerTag | undefined {
  if (!tag.startsWith(LOAD_BALANCER_TAG_PREFIX)) {
    return undefined
  }

  const rest = tag.slice(LOAD_BALANCER_TAG_PREFIX.length)

  if (rest === 'ignore') {
    return { type: 'ignore' }
  }

  const separatorIndex = rest.indexOf('=')

  if (separatorIndex === -1) {
    return undefined
  }

  const key = rest.slice(0, separatorIndex)
  const group = rest.slice(separatorIndex + 1)

  if (group === '') {
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

export interface LoadBalancerConfig {
  affinityGroups: string[]
  antiAffinityGroups: string[]
  isIgnored: boolean
  hasLoadBalancerTags: boolean
}

export function getLoadBalancerConfig(tags: string[]): LoadBalancerConfig {
  const affinityGroups: string[] = []
  const antiAffinityGroups: string[] = []
  let isIgnored = false

  for (const tag of tags) {
    const parsed = parseLoadBalancerTag(tag)

    if (parsed === undefined) {
      continue
    }

    if (parsed.type === 'ignore') {
      isIgnored = true
    } else if (parsed.type === 'affinity') {
      affinityGroups.push(parsed.group)
    } else if (parsed.type === 'anti-affinity') {
      antiAffinityGroups.push(parsed.group)
    }
  }

  // Anti-affinity has priority: remove groups that appear in both
  const filteredAffinityGroups = affinityGroups.filter(group => !antiAffinityGroups.includes(group))

  return {
    affinityGroups: filteredAffinityGroups,
    antiAffinityGroups,
    isIgnored,
    hasLoadBalancerTags: isIgnored || filteredAffinityGroups.length > 0 || antiAffinityGroups.length > 0,
  }
}

type TagAccent = 'info' | 'neutral' | 'success' | 'warning' | 'danger' | 'muted'

export interface TagWithLoadBalancerAccent {
  label: string
  accent: TagAccent
}

export function resolveLoadBalancerTagAccent(tag: string): TagWithLoadBalancerAccent {
  const parsed = parseLoadBalancerTag(tag)

  if (parsed === undefined) {
    return { label: tag, accent: 'info' }
  }

  if (parsed.type === 'ignore') {
    return { label: tag, accent: 'warning' }
  }

  if (parsed.type === 'affinity') {
    return { label: tag, accent: 'success' }
  }

  return { label: tag, accent: 'danger' }
}
