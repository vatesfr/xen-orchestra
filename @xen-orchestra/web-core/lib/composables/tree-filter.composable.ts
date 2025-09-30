import type { TreeNodeBase } from '@core/composables/tree/tree-node-base'
import { refDebounced } from '@vueuse/shared'
import { computed, ref } from 'vue'

export function useTreeFilter() {
  const filter = ref('')
  const debouncedFilter = refDebounced(filter, 500)
  const hasFilter = computed(() => debouncedFilter.value.trim().length > 0)

  const predicate = (node: TreeNodeBase) =>
    hasFilter.value ? node.label.toLocaleLowerCase().includes(debouncedFilter.value.toLocaleLowerCase()) : undefined

  return { filter, predicate }
}
