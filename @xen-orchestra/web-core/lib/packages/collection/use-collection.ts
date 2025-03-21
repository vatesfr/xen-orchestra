import { createItemBuilder } from '@core/packages/collection/create-item-builder.ts'
import { parseFlagsOption } from '@core/packages/collection/parse-flags-option.ts'
import type {
  CollectionItem,
  CollectionOptions,
  ExtractFlags,
  ExtractProperties,
} from '@core/packages/collection/types.ts'
import { useArrayFilter, useArrayMap } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, reactive } from 'vue'

export function useCollection<
  TSource,
  TId extends string,
  const TOptions extends CollectionOptions<TSource, TId>,
  TFlag extends string = ExtractFlags<TOptions>,
  TProperties extends Record<string, any> = ExtractProperties<TOptions>,
>(sources: MaybeRefOrGetter<TSource[]>, options: TOptions) {
  const context =
    options.context ??
    reactive({
      flags: computed(() => parseFlagsOption(options.flags)),
      registeredFlags: new Map<TFlag, Map<TId, boolean>>(),
    })

  function getRegisteredFlagMap(flag: TFlag) {
    if (!context.registeredFlags.has(flag)) {
      context.registeredFlags.set(flag, new Map())
    }

    return context.registeredFlags.get(flag)!
  }

  const buildItem = createItemBuilder<TSource, TId, TFlag, TProperties>({
    hasItemFlag,
    toggleItemFlag,
    propertiesOption: options.properties,
  })

  const items = useArrayMap(sources, source => buildItem(options.identifier(source), source))

  function areMultipleFlagsAllowed(flag: TFlag) {
    return context.flags.get(flag)?.multiple ?? true
  }

  function clearFlag(flag: TFlag) {
    getRegisteredFlagMap(flag).clear()
  }

  function flagItem(id: TId, flag: TFlag) {
    if (!areMultipleFlagsAllowed(flag)) {
      clearFlag(flag)
    }

    getRegisteredFlagMap(flag).set(id, true)
  }

  function unflagItem(id: TId, flag: TFlag) {
    getRegisteredFlagMap(flag).set(id, false)
  }

  function hasItemFlag(id: TId, flag: TFlag) {
    return getRegisteredFlagMap(flag).get(id) ?? context.flags.get(flag)?.default ?? false
  }

  function toggleItemFlag(id: TId, flag: TFlag, forcedValue = !hasItemFlag(id, flag)) {
    if (forcedValue) {
      flagItem(id, flag)
    } else {
      unflagItem(id, flag)
    }
  }

  function useSubset(filter: (item: CollectionItem<TSource, TId, TFlag, TProperties>) => boolean) {
    return useCollection(
      computed(() => items.value.filter(filter).map(item => item.source)),
      {
        ...options,
        context,
      }
    )
  }

  function useFlag(flag: TFlag) {
    const flaggedItems = useArrayFilter(items, item => item.flags[flag] ?? false)

    const ids = useArrayMap(flaggedItems, item => item.id)

    const count = computed(() => flaggedItems.value.length)

    const areAllOn = computed(() => items.value.length === count.value)

    const areSomeOn = computed(() => count.value > 0)

    const areNoneOn = computed(() => count.value === 0)

    const toggle = (forcedValue = !areAllOn.value) =>
      items.value.forEach(forcedValue ? item => flagItem(item.id, flag) : item => unflagItem(item.id, flag))

    return {
      items: flaggedItems,
      ids,
      count,
      areAllOn,
      areSomeOn,
      areNoneOn,
      toggle,
    }
  }

  return {
    items,
    useSubset,
    useFlag,
  }
}
