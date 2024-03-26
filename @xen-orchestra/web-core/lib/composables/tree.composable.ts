import { buildTree } from '@core/composables/tree/build-tree'
import type {
  CollectionContext,
  Definition,
  DefinitionToItem,
  Item,
  UseCollectionOptions,
} from '@core/composables/tree/types'
import { computed, type MaybeRefOrGetter, reactive, ref, toValue } from 'vue'

export function useTree<TDefinition extends Definition, TItem extends Item = DefinitionToItem<TDefinition>>(
  definitions: MaybeRefOrGetter<TDefinition[]>,
  options?: UseCollectionOptions
) {
  const context = reactive({
    allowMultiSelect: options?.allowMultiSelect ?? false,
    selectedItems: ref(new Map()),
    expandedItems: ref(new Map()),
    activeItem: ref(),
  }) as CollectionContext<TItem>

  const selectedItems = computed(() => Array.from(context.selectedItems.values()))
  const expandedItems = computed(() => Array.from(context.expandedItems.values()))
  const activeItem = computed(() => context.activeItem)

  const rawItems = computed(() => buildTree(toValue(definitions), context))
  const items = computed(() => rawItems.value.filter(item => item.isVisible))

  if (options?.expand !== false) {
    items.value.forEach(item => item.isGroup && item.toggleExpand(true, true))
  }

  const deactivate = () => (context.activeItem = undefined)

  const selectedLabel = computed(() => {
    if (typeof options?.selectedLabel === 'function') {
      return options.selectedLabel(selectedItems.value)
    }

    if (typeof options?.selectedLabel === 'object' && selectedItems.value.length > options.selectedLabel.max) {
      return options.selectedLabel.fn(selectedItems.value.length)
    }

    return selectedItems.value.map(item => item.label).join(', ')
  })

  return {
    items,
    deactivate,
    activeItem,
    selectedItems,
    selectedLabel,
    expandedItems,
  }
}
