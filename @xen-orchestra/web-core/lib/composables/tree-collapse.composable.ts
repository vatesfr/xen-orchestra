import type { TreeNodeId } from '@core/packages/tree/types.ts'
import { useLocalStorage } from '@vueuse/core'
import { computed, reactive, type Ref, ref, watch } from 'vue'

export function useTreeCollapse(storageKey: string, filter: Ref<string>, hasFilter: Ref<boolean>) {
  const collapseState = reactive({
    default: useLocalStorage(storageKey, new Set<TreeNodeId>()),
    filtered: ref(new Set<TreeNodeId>()),
  })

  watch(filter, () => collapseState.filtered.clear())

  return computed(() => (hasFilter.value ? collapseState.filtered : collapseState.default))
}
