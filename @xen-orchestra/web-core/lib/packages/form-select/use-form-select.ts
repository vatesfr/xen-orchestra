import {
  type CollectionItemId,
  type CollectionItemProperties,
  type GetItemId,
  guessItemId,
  useCollection,
} from '@core/packages/collection'
import type { EmptyObject, MaybeArray } from '@core/types/utility.type.ts'
import { toArray } from '@core/utils/to-array.utils.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type ComputedRef, type MaybeRefOrGetter, provide, ref, type Ref, toRaw, toValue, watch } from 'vue'
import { guessLabel } from './guess-label.ts'
import { guessValue } from './guess-value.ts'
import { normalizeSearchTerm } from './normalize-search-term.ts'
import {
  EMPTY_OPTION,
  type ExtractValue,
  type FormOptionCollectionItemProperties,
  type FormSelect,
  type FormSelectId,
  type GetOptionLabel,
  type GetOptionValue,
  type UseFormSelectReturn,
} from './types.ts'

// Overload #1: Source is CollectionItemId

export function useFormSelect<
  TSource extends CollectionItemId,
  TCustomProperties extends CollectionItemProperties = EmptyObject,
  TGetValue extends GetOptionValue<TSource, TCustomProperties> = undefined,
  TMultiple extends boolean = false,
  TEmptyValue = never,
  $TValue = ExtractValue<TSource, TGetValue>,
>(
  sources: MaybeRefOrGetter<TSource[]>,
  config?: {
    multiple?: MaybeRefOrGetter<TMultiple>
    model?: Ref<unknown>
    disabled?: MaybeRefOrGetter<boolean>
    selectedLabel?: (count: number, labels: string[]) => string | undefined
    placeholder?: MaybeRefOrGetter<string>
    searchPlaceholder?: MaybeRefOrGetter<string>
    loading?: MaybeRefOrGetter<boolean>
    required?: MaybeRefOrGetter<boolean>
    searchable?: MaybeRefOrGetter<boolean>
    emptyOption?: MaybeRefOrGetter<{
      value: TEmptyValue
      properties?: TCustomProperties
      label: string
      selectedLabel?: string
    }>
    option?: {
      id?: GetItemId<TSource>
      value?: TGetValue | ((source: TSource, properties: TCustomProperties, index: number) => $TValue)
      properties?: (source: TSource) => TCustomProperties
      label?: GetOptionLabel<TSource, TCustomProperties>
      selectedLabel?: (source: TSource, properties: TCustomProperties) => string
      disabled?: (source: TSource, properties: TCustomProperties) => boolean
      searchableTerm?: (source: TSource, properties: TCustomProperties) => MaybeArray<string>
    }
  }
): UseFormSelectReturn<TCustomProperties, TSource, $TValue | TEmptyValue, TMultiple>

// Overload #2: Source is an object with id and label

export function useFormSelect<
  TSource extends { id: CollectionItemId; label: string },
  TCustomProperties extends CollectionItemProperties = EmptyObject,
  TGetValue extends GetOptionValue<TSource, TCustomProperties> = undefined,
  TMultiple extends boolean = false,
  TEmptyValue = never,
  $TValue = ExtractValue<TSource, TGetValue>,
>(
  sources: MaybeRefOrGetter<TSource[]>,
  config?: {
    multiple?: MaybeRefOrGetter<TMultiple>
    model?: Ref<unknown>
    disabled?: MaybeRefOrGetter<boolean>
    selectedLabel?: (count: number, labels: string[]) => string | undefined
    placeholder?: MaybeRefOrGetter<string>
    searchPlaceholder?: MaybeRefOrGetter<string>
    loading?: MaybeRefOrGetter<boolean>
    required?: MaybeRefOrGetter<boolean>
    searchable?: MaybeRefOrGetter<boolean>
    emptyOption?: MaybeRefOrGetter<{
      value: TEmptyValue
      properties?: TCustomProperties
      label: string
      selectedLabel?: string
    }>
    option?: {
      id?: GetItemId<TSource>
      value?: TGetValue | ((source: TSource, properties: TCustomProperties, index: number) => $TValue)
      properties?: (source: TSource) => TCustomProperties
      label?: GetOptionLabel<TSource, TCustomProperties>
      selectedLabel?: (source: TSource, properties: TCustomProperties) => string
      disabled?: (source: TSource, properties: TCustomProperties) => boolean
      searchableTerm?: (source: TSource, properties: TCustomProperties) => MaybeArray<string>
    }
  }
): UseFormSelectReturn<TCustomProperties, TSource, $TValue | TEmptyValue, TMultiple>

// Overload #3: Source is an object with id only

export function useFormSelect<
  TSource extends { id: CollectionItemId },
  TCustomProperties extends CollectionItemProperties = EmptyObject,
  TGetValue extends GetOptionValue<TSource, TCustomProperties> = undefined,
  TMultiple extends boolean = false,
  TEmptyValue = never,
  $TValue = ExtractValue<TSource, TGetValue>,
>(
  sources: MaybeRefOrGetter<TSource[]>,
  config: {
    multiple?: MaybeRefOrGetter<TMultiple>
    model?: Ref<unknown>
    disabled?: MaybeRefOrGetter<boolean>
    selectedLabel?: (count: number, labels: string[]) => string | undefined
    placeholder?: MaybeRefOrGetter<string>
    searchPlaceholder?: MaybeRefOrGetter<string>
    loading?: MaybeRefOrGetter<boolean>
    required?: MaybeRefOrGetter<boolean>
    searchable?: MaybeRefOrGetter<boolean>
    emptyOption?: MaybeRefOrGetter<{
      value: TEmptyValue
      properties?: TCustomProperties
      label: string
      selectedLabel?: string
    }>
    option: {
      id?: GetItemId<TSource>
      value?: TGetValue | ((source: TSource, properties: TCustomProperties, index: number) => $TValue)
      properties?: (source: TSource) => TCustomProperties
      label: GetOptionLabel<TSource, TCustomProperties>
      selectedLabel?: (source: TSource, properties: TCustomProperties) => string
      disabled?: (source: TSource, properties: TCustomProperties) => boolean
      searchableTerm?: (source: TSource, properties: TCustomProperties) => MaybeArray<string>
    }
  }
): UseFormSelectReturn<TCustomProperties, TSource, $TValue | TEmptyValue, TMultiple>

// Overload #4: Source is an object with label only

export function useFormSelect<
  TSource extends { label: string },
  TCustomProperties extends CollectionItemProperties = EmptyObject,
  TGetValue extends GetOptionValue<TSource, TCustomProperties> = undefined,
  TMultiple extends boolean = false,
  TEmptyValue = never,
  $TValue = ExtractValue<TSource, TGetValue>,
>(
  sources: MaybeRefOrGetter<TSource[]>,
  config: {
    multiple?: MaybeRefOrGetter<TMultiple>
    model?: Ref<unknown>
    disabled?: MaybeRefOrGetter<boolean>
    selectedLabel?: (count: number, labels: string[]) => string | undefined
    placeholder?: MaybeRefOrGetter<string>
    searchPlaceholder?: MaybeRefOrGetter<string>
    loading?: MaybeRefOrGetter<boolean>
    required?: MaybeRefOrGetter<boolean>
    searchable?: MaybeRefOrGetter<boolean>
    emptyOption?: MaybeRefOrGetter<{
      value: TEmptyValue
      properties?: TCustomProperties
      label: string
      selectedLabel?: string
    }>
    option: {
      id: GetItemId<TSource>
      value?: TGetValue | ((source: TSource, properties: TCustomProperties, index: number) => $TValue)
      properties?: (source: TSource) => TCustomProperties
      label?: GetOptionLabel<TSource, TCustomProperties>
      selectedLabel?: (source: TSource, properties: TCustomProperties) => string
      disabled?: (source: TSource, properties: TCustomProperties) => boolean
      searchableTerm?: (source: TSource, properties: TCustomProperties) => MaybeArray<string>
    }
  }
): UseFormSelectReturn<TCustomProperties, TSource, $TValue | TEmptyValue, TMultiple>

// Overload #5: Any other case

export function useFormSelect<
  TSource,
  TCustomProperties extends CollectionItemProperties = EmptyObject,
  TGetValue extends GetOptionValue<TSource, TCustomProperties> = undefined,
  TMultiple extends boolean = false,
  TEmptyValue = never,
  $TValue = ExtractValue<TSource, TGetValue>,
>(
  sources: MaybeRefOrGetter<TSource[]>,
  config: {
    multiple?: MaybeRefOrGetter<TMultiple>
    model?: Ref<unknown>
    disabled?: MaybeRefOrGetter<boolean>
    selectedLabel?: (count: number, labels: string[]) => string | undefined
    placeholder?: MaybeRefOrGetter<string>
    searchPlaceholder?: MaybeRefOrGetter<string>
    loading?: MaybeRefOrGetter<boolean>
    required?: MaybeRefOrGetter<boolean>
    searchable?: MaybeRefOrGetter<boolean>
    emptyOption?: MaybeRefOrGetter<{
      value: TEmptyValue
      properties?: TCustomProperties
      label: string
      selectedLabel?: string
    }>
    option: {
      id: GetItemId<TSource>
      value?: TGetValue | ((source: TSource, properties: TCustomProperties, index: number) => $TValue)
      properties?: (source: TSource) => TCustomProperties
      label: GetOptionLabel<TSource, TCustomProperties>
      selectedLabel?: (source: TSource, properties: TCustomProperties) => string
      disabled?: (source: TSource, properties: TCustomProperties) => boolean
      searchableTerm?: (source: TSource, properties: TCustomProperties) => MaybeArray<string>
    }
  }
): UseFormSelectReturn<TCustomProperties, TSource, $TValue | TEmptyValue, TMultiple>

// Implementation

export function useFormSelect<
  TSource,
  TCustomProperties extends CollectionItemProperties = EmptyObject,
  TGetValue extends GetOptionValue<TSource, TCustomProperties> = undefined,
  TMultiple extends boolean = false,
  TEmptyValue = never,
  $TValue = ExtractValue<TSource, TGetValue>,
>(
  baseSources: MaybeRefOrGetter<TSource[]>,
  config?: {
    multiple?: MaybeRefOrGetter<boolean>
    model?: Ref<unknown>
    disabled?: MaybeRefOrGetter<boolean>
    selectedLabel?: (count: number, labels: string[]) => string | undefined
    placeholder?: MaybeRefOrGetter<string>
    searchPlaceholder?: MaybeRefOrGetter<string>
    loading?: MaybeRefOrGetter<boolean>
    required?: MaybeRefOrGetter<boolean>
    searchable?: MaybeRefOrGetter<boolean>
    emptyOption?: MaybeRefOrGetter<{
      value: TEmptyValue
      properties?: TCustomProperties
      label: string
      selectedLabel?: string
    }>
    option?: {
      id?: GetItemId<TSource>
      value?: GetOptionValue<TSource, TCustomProperties>
      properties?: (source: TSource) => TCustomProperties
      label?: GetOptionLabel<TSource, TCustomProperties>
      selectedLabel?: (source: TSource, properties: TCustomProperties) => string
      disabled?: (source: TSource, properties: TCustomProperties) => boolean
      searchableTerm?: (source: TSource, properties: TCustomProperties) => MaybeArray<string>
    }
  }
): UseFormSelectReturn<TCustomProperties, TSource, $TValue | TEmptyValue, TMultiple> {
  const searchTerm = ref('')

  const normalizedSearchTerm = computed(() => normalizeSearchTerm(searchTerm))

  const isMultiple = toComputed(config?.multiple, false) as ComputedRef<TMultiple>

  const isDisabled = toComputed(config?.disabled, false)

  const isLoading = toComputed(config?.loading, false)

  const isRequired = toComputed(config?.required, false)

  const placeholder = toComputed(config?.placeholder, '')

  const searchPlaceholder = toComputed(config?.searchPlaceholder, '')

  const isSearchable = toComputed(config?.searchable, false)

  const sources = computed(() =>
    config?.emptyOption !== undefined ? [EMPTY_OPTION, ...toValue(baseSources)] : toValue(baseSources)
  ) as ComputedRef<(TSource | typeof EMPTY_OPTION)[]>

  const {
    items: allOptions,
    useSubset,
    useFlag,
  } = useCollection(sources, {
    itemId: source =>
      source === EMPTY_OPTION ? '__EMPTY_OPTION__' : guessItemId(source as TSource, config?.option?.id),
    flags: {
      active: { multiple: false },
      selected: { multiple: isMultiple },
    },
    properties: (source, index): FormOptionCollectionItemProperties<TCustomProperties, $TValue> => {
      if (source === EMPTY_OPTION) {
        const emptyOption = toValue(config?.emptyOption)

        return {
          value: computed(() => emptyOption?.value as $TValue),
          label: computed(() => emptyOption?.label ?? ''),
          selectedLabel: computed(() => emptyOption?.selectedLabel),
          matching: computed(() => normalizedSearchTerm.value === ''),
          disabled: computed(() => false),
          ...(emptyOption?.properties ?? ({} as TCustomProperties)),
        }
      }

      const customProperties = config?.option?.properties?.(source) ?? ({} as TCustomProperties)
      const label = computed(() => guessLabel(source, customProperties, config?.option?.label))
      const value = computed(() => guessValue(source, customProperties, config?.option?.value, index) as $TValue)
      const disabled = computed(() => isDisabled.value || config?.option?.disabled?.(source, customProperties) === true)
      const searchableTerm = computed(() => config?.option?.searchableTerm?.(source, customProperties))
      const selectedLabel = computed(() => config?.option?.selectedLabel?.(source, customProperties))

      const searchableTerms = computed(() =>
        toArray(toValue(searchableTerm) ?? toValue(label)).map(term => normalizeSearchTerm(term))
      )

      const matching = computed(() => {
        if (normalizedSearchTerm.value === '') {
          return true
        }

        return searchableTerms.value.some(term => term.includes(normalizedSearchTerm.value))
      })

      return {
        value,
        label,
        selectedLabel,
        disabled,
        matching,
        ...customProperties,
      }
    },
  })

  const { items: options } = useSubset(option => option.properties.matching)

  const { items: selectedOptions } = useFlag('selected')

  const selectedOption = computed(() => selectedOptions.value[0])

  const selectedValues = computed(() => selectedOptions.value.map(option => option.properties.value))

  const selectedValue = computed(() => selectedValues.value[0])

  const selectedLabels = computed(() =>
    selectedOptions.value.map(option => option.properties.selectedLabel ?? option.properties.label)
  )

  const selectedLabel = computed(
    () => config?.selectedLabel?.(selectedLabels.value.length, selectedLabels.value) ?? selectedLabels.value.join(', ')
  )

  const { model } = config ?? {}

  if (model) {
    watch(
      model,
      modelValue => {
        if (isMultiple.value) {
          allOptions.value.forEach(option => {
            if ((modelValue as $TValue[]).includes(toRaw(option.properties.value) as $TValue)) {
              option.toggleFlag('selected', true)
            } else {
              option.toggleFlag('selected', false)
            }
          })
        } else {
          allOptions.value.forEach(option => {
            option.toggleFlag('selected', toRaw(option.properties.value) === toRaw(modelValue))
          })
        }
      },
      { immediate: true }
    )

    watch(
      selectedValues,
      newValues => {
        if (isMultiple.value) {
          model.value = newValues as TMultiple extends true ? $TValue[] : $TValue
        } else if (newValues.length > 0) {
          model.value = newValues[0] as TMultiple extends true ? $TValue[] : $TValue
        }
      },
      { deep: 1, flush: 'post' }
    )
  }

  const select = {
    isMultiple,
    isDisabled,
    isRequired,
    isSearchable,
    isLoading,
    placeholder,
    searchPlaceholder,
    searchTerm,
    allOptions,
    options,
    selectedValue,
    selectedValues,
    selectedOption,
    selectedOptions,
    selectedLabel,
  } satisfies FormSelect<TCustomProperties, any> as FormSelect<TCustomProperties, TSource, $TValue, TMultiple>

  const id = Symbol('useFormSelect ID') as FormSelectId<TCustomProperties, TSource, $TValue, TMultiple>

  provide(id, select)

  return {
    id,
    ...select,
  } satisfies UseFormSelectReturn<TCustomProperties, TSource, $TValue, TMultiple>
}
