import { useVdfStats } from '@/modules/vdf/remote-resources/use-vdf-stats.ts'
import { computed, type MaybeRefOrGetter, toRef, toValue } from 'vue'

// Per rule, summed over the pool's hosts. Stats are only polled while
// `enabled`: each poll makes every agent sample for a second.
export function useVdfRuleHits(rawPoolId: MaybeRefOrGetter<string>, enabled: MaybeRefOrGetter<boolean>) {
  const { stats } = useVdfStats({ isEnabled: toRef(enabled) }, () => toValue(rawPoolId))

  const hitsByRule = computed(() => {
    const hits = new Map<number, { hitsPerSec: number; live: number }>()

    for (const host of stats.value?.hosts ?? []) {
      for (const rule of host.rules ?? []) {
        const current = hits.get(rule.id) ?? { hitsPerSec: 0, live: 0 }

        hits.set(rule.id, { hitsPerSec: current.hitsPerSec + rule.hitsPerSec, live: current.live + rule.live })
      }
    }

    return hits
  })

  return { stats, hitsByRule }
}
