const LOAD_BALANCER_TAG_PREFIX = 'xo:load:balancer:'

export const LOAD_BALANCER_TAG_AFFINITY = `${LOAD_BALANCER_TAG_PREFIX}affinity=` as const
export const LOAD_BALANCER_TAG_ANTI_AFFINITY = `${LOAD_BALANCER_TAG_PREFIX}anti-affinity=` as const
export const LOAD_BALANCER_TAG_IGNORE = `${LOAD_BALANCER_TAG_PREFIX}ignore` as const

export type LoadBalancerTagType = 'affinity' | 'anti-affinity' | 'ignore'

export interface LoadBalancerTagInfo {
  type: LoadBalancerTagType
  group?: string
  raw: string
}

export function parseLoadBalancerTag(tag: string): LoadBalancerTagInfo | undefined {
  if (tag === LOAD_BALANCER_TAG_IGNORE) {
    return { type: 'ignore', raw: tag }
  }

  if (tag.startsWith(LOAD_BALANCER_TAG_AFFINITY)) {
    return { type: 'affinity', group: tag.slice(LOAD_BALANCER_TAG_AFFINITY.length), raw: tag }
  }

  if (tag.startsWith(LOAD_BALANCER_TAG_ANTI_AFFINITY)) {
    return { type: 'anti-affinity', group: tag.slice(LOAD_BALANCER_TAG_ANTI_AFFINITY.length), raw: tag }
  }

  return undefined
}

export function parseLoadBalancerTags(tags: string[]): LoadBalancerTagInfo[] {
  const result: LoadBalancerTagInfo[] = []

  for (const tag of tags) {
    const parsed = parseLoadBalancerTag(tag)

    if (parsed !== undefined) {
      result.push(parsed)
    }
  }

  return result
}

export function isLoadBalancerTag(tag: string): boolean {
  return tag.startsWith(LOAD_BALANCER_TAG_PREFIX)
}

export function getAffinityGroups(tags: string[]): string[] {
  return tags
    .filter(tag => tag.startsWith(LOAD_BALANCER_TAG_AFFINITY))
    .map(tag => tag.slice(LOAD_BALANCER_TAG_AFFINITY.length))
}

export function getAntiAffinityGroups(tags: string[]): string[] {
  return tags
    .filter(tag => tag.startsWith(LOAD_BALANCER_TAG_ANTI_AFFINITY))
    .map(tag => tag.slice(LOAD_BALANCER_TAG_ANTI_AFFINITY.length))
}

export function isLoadBalancerIgnored(tags: string[]): boolean {
  return tags.includes(LOAD_BALANCER_TAG_IGNORE)
}
