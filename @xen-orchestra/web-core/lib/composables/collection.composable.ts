import { buildCollection } from '@core/composables/collection/build-collection'
import type {
  CollectionContext,
  Definition,
  DefinitionToItem,
  Item,
  UseCollectionOptions,
} from '@core/composables/collection/types'
import { computed, type MaybeRefOrGetter, reactive, type Ref, ref, toValue } from 'vue'

export function useCollection<TDefinition extends Definition, TItem extends Item = DefinitionToItem<TDefinition>>(
  definitions: MaybeRefOrGetter<TDefinition[]>,
  options?: UseCollectionOptions
) {
  const selected = ref(new Map()) as Ref<Map<string, TItem>>
  const expanded = ref(new Map()) as Ref<Map<string, TItem>>
  const active = ref() as Ref<TItem | undefined>

  const context = reactive({
    allowMultiSelect: options?.allowMultiSelect ?? false,
    selected,
    expanded,
    active,
  }) as CollectionContext<TItem>

  const rawItems = computed(() => buildCollection(toValue(definitions), context))
  const items = computed(() => rawItems.value.filter(item => item.isVisible))

  if (options?.expand !== false) {
    items.value.forEach(item => item.isGroup && item.toggleExpand(true, true))
  }

  const deactivate = () => (active.value = undefined)

  const selectedItems = computed(() => Array.from(context.selected.values()))
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
    activeItem: computed(() => context.active),
    selectedItems,
    selectedLabel,
    expandedItems: computed(() => Array.from(context.expanded.values())),
  }
}
