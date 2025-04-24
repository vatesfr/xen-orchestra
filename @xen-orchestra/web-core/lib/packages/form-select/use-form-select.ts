import { useCollection } from '@core/packages/collection'
import type {
  FormOptionProperties,
  FormOptionValue,
  FormSelectBaseConfig,
  FormSelectBaseProperties,
  UseFormSelectReturn,
} from '@core/packages/form-select/types.ts'
import { toArray } from '@core/utils/to-array.utils.ts'
import type { MaybeRefOrGetter } from '@vueuse/shared'
import { computed, reactive, ref } from 'vue'

export function useFormSelect<
  TSource extends { value: FormOptionValue; label: string },
  TValue extends FormOptionValue = TSource['value'],
  TProperties extends FormSelectBaseProperties & {
    value?: TValue
    label?: string
  } = FormSelectBaseProperties & {
    value?: TValue
    label?: string
  },
>(
  sources: MaybeRefOrGetter<TSource[]>,
  config?: FormSelectBaseConfig & {
    properties?: (source: TSource) => TProperties
  }
): UseFormSelectReturn<TSource, TValue, TProperties>

export function useFormSelect<
  TSource extends { id: FormOptionValue; label: string },
  TValue extends FormOptionValue = TSource['id'],
  TProperties extends FormSelectBaseProperties & {
    value?: TValue
    label?: string
  } = FormSelectBaseProperties & {
    value?: TValue
    label?: string
  },
>(
  sources: MaybeRefOrGetter<TSource[]>,
  config?: FormSelectBaseConfig & {
    properties?: (source: TSource) => TProperties
  }
): UseFormSelectReturn<TSource, TValue, TProperties>

export function useFormSelect<
  TSource extends { value: FormOptionValue },
  TValue extends FormOptionValue = TSource['value'],
  TProperties extends FormSelectBaseProperties & {
    value?: TValue
    label: string
  } = FormSelectBaseProperties & {
    value?: TValue
    label: string
  },
>(
  sources: MaybeRefOrGetter<TSource[]>,
  config: FormSelectBaseConfig & {
    properties: (source: TSource) => TProperties
  }
): UseFormSelectReturn<TSource, TValue, TProperties>

export function useFormSelect<
  TSource extends { id: FormOptionValue },
  TValue extends FormOptionValue = TSource['id'],
  TProperties extends FormSelectBaseProperties & {
    value?: TValue
    label: string
  } = FormSelectBaseProperties & {
    value?: TValue
    label: string
  },
>(
  sources: MaybeRefOrGetter<TSource[]>,
  config: FormSelectBaseConfig & {
    properties: (source: TSource) => TProperties
  }
): UseFormSelectReturn<TSource, TValue, TProperties>

export function useFormSelect<
  TSource extends { label: string },
  TValue extends FormOptionValue,
  TProperties extends FormSelectBaseProperties & {
    value?: TValue
    label: string
  } = FormSelectBaseProperties & {
    value?: TValue
    label: string
  },
>(
  sources: MaybeRefOrGetter<TSource[]>,
  config: FormSelectBaseConfig & {
    properties: (source: TSource) => TProperties
  }
): UseFormSelectReturn<TSource, TValue, TProperties>

export function useFormSelect<
  TSource,
  TValue extends FormOptionValue,
  TProperties extends FormSelectBaseProperties & {
    value: TValue
    label: string
  } = FormSelectBaseProperties & {
    value: TValue
    label: string
  },
>(
  sources: MaybeRefOrGetter<TSource[]>,
  config: FormSelectBaseConfig & {
    properties: (source: TSource) => TProperties
  }
): UseFormSelectReturn<TSource, TValue, TProperties>

export function useFormSelect<
  TSource,
  TProperties extends FormSelectBaseProperties & {
    value?: FormOptionValue
    label?: string
  },
>(
  sources: MaybeRefOrGetter<TSource[]>,
  config?: FormSelectBaseConfig & {
    properties?: (source: TSource) => TProperties
  }
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
    useFlag,
    useSubset,
  } = useCollection(sources, {
    flags: {
      active: { multiple: false },
      selected: { multiple: config?.multiple ?? false },
    },
    properties: (source: TSource) => {
      const {
        value = (source as { value: FormOptionValue }).value ?? (source as { id: FormOptionValue }).id,
        label = (source as { label: string }).label,
        disabled = false,
        searchableTerm,
        ...extraProperties
      } = config?.properties?.(source) ?? {}

      const matching = computed(() => {
        if (!searchTerm.value) {
          return true
        }

        const searchableTerms = toArray(searchableTerm ?? label)

        return searchableTerms.some(term => term.toLowerCase().includes(searchTerm.value))
      })

      return reactive({
        id: value,
        label,
        multiple: config?.multiple ?? false,
        disabled,
        matching,
        ...extraProperties,
      }) satisfies FormOptionProperties<FormOptionValue>
    },
  })

  const { items: options } = useSubset(option => option.properties.matching)

  const { items: selectedOptions, ids: selectedValues } = useFlag('selected')

  const selectedLabels = computed(() => selectedOptions.value.map(option => option.properties.label))

  const selectedLabel = computed(
    () => config?.selectedLabel?.(selectedLabels.value.length, selectedLabels.value) ?? selectedLabels.value.join(', ')
  )

  return {
    searchTerm,
    allOptions,
    options,
    selectedOptions,
    selectedValues,
    selectedLabel,
  }
}
