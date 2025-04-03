import type {
  CollectionFilterFlags,
  CollectionFilterProperties,
  CollectionOptions,
  ExtractAllowedFlag,
  ExtractProperties,
} from '@core/composables/collection/collection.types.ts'
import { createItemBuilder, parseAllowedFlagsOption } from '@core/composables/collection/collection.utils.ts'
import { toArray } from '@core/utils/to-array.utils.ts'
import { useArrayMap } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, reactive, toValue } from 'vue'

export function useCollection<
  TSource,
  TId extends string,
  const TOptions extends CollectionOptions<TSource, TId>,
  TAllowedFlag extends string = ExtractAllowedFlag<TOptions>,
  TProperties extends Record<string, any> = ExtractProperties<TOptions>,
>(sources: MaybeRefOrGetter<TSource[]>, options: TOptions) {
  const allowedFlags = computed(() => parseAllowedFlagsOption(options.allowedFlags))

  const _registeredFlags = reactive(new Map()) as Map<TAllowedFlag, Map<TId, boolean>>

  function getRegisteredFlagMap(flag: TAllowedFlag) {
    assertFlagAllowed(flag)

    if (!_registeredFlags.has(flag)) {
      _registeredFlags.set(flag, new Map())
    }

    return _registeredFlags.get(flag)!
  }

  const buildItem = createItemBuilder<TSource, TId, TAllowedFlag, TProperties>({
    hasItemFlag,
    toggleItemFlag,
    propertiesOption: options.properties,
  })

  const items = useArrayMap(sources, source => buildItem(options.identifier(source), source))

  function assertFlagAllowed(flag: TAllowedFlag) {
    if (!allowedFlags.value.has(flag)) {
      throw new Error(`Flag "${flag}" is not allowed`)
    }
  }

  function areMultipleFlagsAllowed(flag: TAllowedFlag) {
    assertFlagAllowed(flag)

    return allowedFlags.value.get(flag)?.multiple ?? true
  }

  function clearFlag(flag: TAllowedFlag) {
    getRegisteredFlagMap(flag).clear()
  }

  function flagItem(id: TId, flag: TAllowedFlag) {
    if (!areMultipleFlagsAllowed(flag)) {
      clearFlag(flag)
    }

    getRegisteredFlagMap(flag).set(id, true)
  }

  function unflagItem(id: TId, flag: TAllowedFlag) {
    getRegisteredFlagMap(flag).set(id, false)
  }

  function hasItemFlag(id: TId, flag: TAllowedFlag) {
    return getRegisteredFlagMap(flag).get(id) ?? allowedFlags.value.get(flag)?.default ?? false
  }

  function toggleItemFlag(id: TId, flag: TAllowedFlag, forcedValue = !hasItemFlag(id, flag)) {
    if (forcedValue) {
      flagItem(id, flag)
    } else {
      unflagItem(id, flag)
    }
  }

  function getItemById(id: TId) {
    return items.value.find(item => item.id === id)
  }

  function getItemsBy(criteria: {
    flags?: CollectionFilterFlags<TAllowedFlag>
    properties?: CollectionFilterProperties<TProperties>
  }) {
    return items.value.filter(item => {
      if (
        !Object.entries(criteria.properties ?? {}).every(
          ([property, propertyValue]) => item.properties[property] === toValue(propertyValue)
        )
      ) {
        return false
      }

      return toArray(toValue(criteria.flags)).every(flag => hasItemFlag(item.id, flag))
    })
  }

  function useItemsBy(criteria: {
    flags?: CollectionFilterFlags<TAllowedFlag>
    properties?: CollectionFilterProperties<TProperties>
  }) {
    return computed(() => getItemsBy(toValue(criteria)))
  }

  function getItemsByProperty<TProperty extends keyof CollectionFilterProperties<TProperties>>(
    property: TProperty,
    value: CollectionFilterProperties<TProperties>[TProperty]
  ) {
    return getItemsBy({ properties: { [property]: value } as CollectionFilterProperties<TProperties> })
  }

  function useItemsByProperty<TProperty extends keyof CollectionFilterProperties<TProperties>>(
    property: TProperty,
    value: CollectionFilterProperties<TProperties>[TProperty]
  ) {
    return computed(() => getItemsByProperty(property, value))
  }

  function getItemsByFlag(flags: CollectionFilterFlags<TAllowedFlag>) {
    return getItemsBy({ flags })
  }

  function useItemsByFlag(flags: CollectionFilterFlags<TAllowedFlag>) {
    return computed(() => getItemsByFlag(flags))
  }

  function useFlag(flag: TAllowedFlag, properties?: CollectionFilterProperties<TProperties>) {
    const matchingItems = useItemsBy({ properties })

    const currentItems = useItemsBy({
      flags: flag,
      properties,
    })

    const ids = computed(() => currentItems.value.map(item => item.id))

    const countOn = computed(() => currentItems.value.length)

    const countAll = computed(() => matchingItems.value.length)

    const all = computed(() => matchingItems.value.length === countOn.value)

    const some = computed(() => countOn.value > 0)

    const none = computed(() => countOn.value === 0)

    const toggle = (forcedValue = !all.value) =>
      matchingItems.value.forEach(forcedValue ? item => flagItem(item.id, flag) : item => unflagItem(item.id, flag))

    const toggleOn = () => toggle(true)

    const toggleOff = () => toggle(false)

    return {
      items: currentItems,
      ids,
      countOn,
      countAll,
      all,
      some,
      none,
      toggle,
      toggleOn,
      toggleOff,
    }
  }

  return {
    items,
    flagItem,
    unflagItem,
    hasItemFlag,
    toggleItemFlag,
    useFlag,
    getItemById,
    getItemsBy,
    useItemsBy,
    getItemsByProperty,
    useItemsByProperty,
    getItemsByFlag,
    useItemsByFlag,
  }
}
