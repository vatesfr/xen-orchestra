import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export type HostQuickAction = 'start' | 'shutdown' | 'reboot'

export function useHostQuickActions(host: MaybeRefOrGetter<XenApiHost>) {
  const { isHostRunning } = useHostMetricsStore().subscribe()

  return computed((): HostQuickAction[] => (isHostRunning(toValue(host)) ? ['shutdown', 'reboot'] : ['start']))
}
