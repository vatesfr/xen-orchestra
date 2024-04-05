import type { TreeNodeBase } from '@core/composables/tree/tree-node-base'
import { computed, ref } from 'vue'

export function useTreeFilter() {
  const filter = ref('')
  const hasFilter = computed(() => filter.value.trim().length > 0)

  const predicate = (node: TreeNodeBase) =>
    hasFilter.value ? node.label.toLowerCase().includes(filter.value.toLowerCase()) : undefined

  return { filter, predicate }
}
