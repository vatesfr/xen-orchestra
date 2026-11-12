import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { TagSelectSuggestion } from '@core/components/tag-select/VtsTagSelect.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useVmTagSuggestions() {
  const { t } = useI18n()

  const { vms } = useXoVmCollection()

  const vmsCountByTag = computed(() => {
    const counts = new Map<string, number>()

    vms.value.forEach(vm => {
      vm.tags.forEach(tag => counts.set(tag, (counts.get(tag) ?? 0) + 1))
    })

    return counts
  })

  const tagSuggestions = computed<TagSelectSuggestion[]>(() =>
    Array.from(vmsCountByTag.value, ([tag, count]) => ({ tag, info: t('n-vms', { n: count }) })).sort(
      (suggestion1, suggestion2) => suggestion1.tag.localeCompare(suggestion2.tag)
    )
  )

  return { tagSuggestions }
}
