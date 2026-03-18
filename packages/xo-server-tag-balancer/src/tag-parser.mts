import type { XoVm } from '@vates/types'
import type { VmLoadBalancerTags } from './types.mjs'

const LB_PREFIX = 'xo:load:balancer:'

export function parseLoadBalancerTags(tags: string[]): VmLoadBalancerTags {
  const result: VmLoadBalancerTags = {
    ignore: false,
    affinityGroups: new Set(),
    antiAffinityGroups: new Set(),
  }

  for (const tag of tags) {
    if (!tag.startsWith(LB_PREFIX)) {
      continue
    }

    const rest = tag.slice(LB_PREFIX.length)

    if (rest === 'ignore') {
      result.ignore = true
    } else if (rest.startsWith('affinity=')) {
      const group = rest.slice('affinity='.length)
      if (group.length > 0) {
        result.affinityGroups.add(group)
      }
    } else if (rest.startsWith('anti-affinity=')) {
      const group = rest.slice('anti-affinity='.length)
      if (group.length > 0) {
        result.antiAffinityGroups.add(group)
      }
    }
  }

  return result
}

export function parseAllVmTags(vms: Pick<XoVm, 'id' | 'tags'>[]): Map<XoVm['id'], VmLoadBalancerTags> {
  const result = new Map<XoVm['id'], VmLoadBalancerTags>()

  for (const vm of vms) {
    result.set(vm.id, parseLoadBalancerTags(vm.tags))
  }

  return result
}
