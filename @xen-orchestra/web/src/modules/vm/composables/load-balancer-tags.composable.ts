import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { getLoadBalancerConfig } from '@/modules/vm/utils/load-balancer-tags.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'

export function useLoadBalancerTags(vm: MaybeRefOrGetter<FrontXoVm>) {
  return computed(() => getLoadBalancerConfig(toValue(vm).tags))
}
