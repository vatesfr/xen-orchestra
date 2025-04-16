import { useCollection } from '@core/packages/collection'
import type { UseFormOptionsConfig } from '@core/packages/form-select/type.ts'
import { toArray } from '@core/utils/to-array.utils.ts'
import type { MaybeRefOrGetter } from '@vueuse/shared'
import { computed, ref } from 'vue'

export function useFormOptions<TEntry, TValue extends PropertyKey>(
  entries: MaybeRefOrGetter<TEntry[]>,
  config: UseFormOptionsConfig<TEntry, TValue>
) {
  const _searchTerm = ref('')

  const searchTerm = computed({
    get: () => _searchTerm.value,
    set: (value: string) => {
      _searchTerm.value = value.toLowerCase().trim()
    },
  })

  const {
    items: allOptions,
    useSubset,
    useFlag,
  } = useCollection(entries, {
    identifier: entry => config.getValue(entry),
    flags: {
      selected: { multiple: config.multiple ?? false },
      active: { multiple: false },
    },
    properties: entry => {
      const label = computed(() => config.getLabel(entry))

      return {
        label,
        disabled: computed(() => config.getDisabled?.(entry) ?? false),
        multiple: computed(() => config.multiple ?? false),
        matching: computed(() => {
          if (!searchTerm.value) {
            return true
          }

          const searchableTerms = toArray(config.getSearchableTerm?.(entry) ?? label.value)

          return searchableTerms.some(term => term.toLowerCase().includes(searchTerm.value))
        }),
      }
    },
  })

  const { items: selectedOptions, ids: selectedValues } = useFlag('selected')

  const matchingSubset = useSubset(option => option.properties.matching)

  const filteredOptions = computed(() => {
    if (!searchTerm.value) {
      return allOptions.value
    }

    return matchingSubset.items.value
  })

  return {
    searchTerm,
    allOptions,
    options: filteredOptions,
    selectedOptions,
    selectedValues,
  }
}
