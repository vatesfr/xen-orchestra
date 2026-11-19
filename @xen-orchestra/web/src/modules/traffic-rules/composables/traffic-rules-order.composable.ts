import type { RankedTrafficRule } from '@/modules/traffic-rules/types.ts'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { type MaybeRefOrGetter, ref, toValue } from 'vue'

export function useTrafficRulesOrder(rawRules: MaybeRefOrGetter<RankedTrafficRule[]>) {
  const orderedRules = ref([...toValue(rawRules)])

  const {
    pageRecords: paginatedRules,
    paginationBindings,
    seek,
  } = usePagination('traffic-rules-order', orderedRules, {
    ignoreRoute: true,
  })

  function getRuleIndex(rule: RankedTrafficRule) {
    return orderedRules.value.findIndex(orderedRule => orderedRule.id === rule.id)
  }

  function getNewRank(rule: RankedTrafficRule) {
    return getRuleIndex(rule) + 1
  }

  function isFirstRule(rule: RankedTrafficRule) {
    return getRuleIndex(rule) === 0
  }

  function isLastRule(rule: RankedTrafficRule) {
    return getRuleIndex(rule) === orderedRules.value.length - 1
  }

  function moveRule(rule: RankedTrafficRule, offset: -1 | 1) {
    const index = getRuleIndex(rule)
    const newIndex = index + offset

    if (index === -1 || newIndex < 0 || newIndex >= orderedRules.value.length) {
      return
    }

    const newOrderedRules = [...orderedRules.value]
    const [movedRule] = newOrderedRules.splice(index, 1)
    newOrderedRules.splice(newIndex, 0, movedRule)

    orderedRules.value = newOrderedRules

    seek(orderedRule => orderedRule.id === rule.id)
  }

  return {
    orderedRules,
    paginatedRules,
    paginationBindings,
    getNewRank,
    isFirstRule,
    isLastRule,
    moveRule,
  }
}
