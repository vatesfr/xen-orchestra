import { clamp, useSorted } from '@vueuse/core'
import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue'

export function useRanked<TRank extends string | number>(
  ranks: MaybeRefOrGetter<TRank[]>,
  ranking: NoInfer<TRank>[]
): ComputedRef<TRank[]>

export function useRanked<TItem, TRank extends string | number>(
  items: MaybeRefOrGetter<TItem[]>,
  getRank: (item: TItem) => TRank,
  ranking: NoInfer<TRank>[]
): ComputedRef<TItem[]>

export function useRanked<TItem, TRank extends string | number>(
  items: MaybeRefOrGetter<TItem[]>,
  ranksOrGetRank: TRank[] | ((item: TItem) => TRank),
  ranksOrNone?: TRank[]
) {
  const getRank = typeof ranksOrGetRank === 'function' ? ranksOrGetRank : (item: TItem) => item as unknown as TRank

  const ranks = ranksOrNone === undefined ? (ranksOrGetRank as TRank[]) : ranksOrNone

  const ranksMap = computed(() => Object.fromEntries(ranks.map((rank, index) => [rank, index + 1]))) as ComputedRef<
    Record<TRank, number>
  >

  function getRankNumber(item: TItem): number {
    return ranksMap.value[getRank(item)] ?? toValue(items).length + 1
  }

  function compare(item1: TItem, item2: TItem) {
    return clamp(getRankNumber(item1) - getRankNumber(item2), -1, 1) as -1 | 0 | 1
  }

  return useSorted(items, compare)
}
