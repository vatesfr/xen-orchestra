import {
  type CollectionItemId,
  type CollectionItemProperties,
  type GetItemId,
  guessItemId,
  useCollection,
} from '@core/packages/collection'
import type { EmptyObject, MaybeArray } from '@core/types/utility.type.ts'
import { toArray } from '@core/utils/to-array.utils.ts'
import type {
  ExtractValue,
  FormOptionCollectionItemProperties,
  FormSelect,
  FormSelectId,
  GetOptionLabel,
  GetOptionValue,
  UseFormSelectReturn,
} from './types.ts'
import { computed, type ComputedRef, type MaybeRefOrGetter, provide, ref, type Ref, toValue, watch } from 'vue'
import { guessLabel } from './guess-label.ts'
import { guessValue } from './guess-value.ts'
import { toSearchTerm } from './to-search-term.ts'

// Overload #1: Source is CollectionItemId

export function useFormSelect<
  TBaseSource extends CollectionItemId,
  TAllowEmpty extends boolean = false,
  TCustomProperties extends CollectionItemProperties = EmptyObject,
  TGetValue extends GetOptionValue<$TSource, TCustomProperties> = undefined,
  TMultiple extends boolean = false,
  $TSource = TAllowEmpty extends true ? TBaseSource | undefined : TBaseSource,
  $TValue = ExtractValue<$TSource, TGetValue>,
>(
  sources: MaybeRefOrGetter<TBaseSource[]>,
  config?: {
    allowEmpty?: MaybeRefOrGetter<TAllowEmpty>
    multiple?: MaybeRefOrGetter<TMultiple>
    model?: Ref<unknown>
    disabled?: MaybeRefOrGetter<boolean>
    selectedLabel?: (count: number, labels: string[]) => string
    placeholder?: MaybeRefOrGetter<string>
    searchPlaceholder?: MaybeRefOrGetter<string>
    loading?: MaybeRefOrGetter<boolean>
    required?: MaybeRefOrGetter<boolean>
    searchable?: MaybeRefOrGetter<boolean>
    option?: {
      id?: GetItemId<TBaseSource>
      value?: TGetValue | ((source: $TSource, properties: TCustomProperties) => $TValue)
      properties?: (source: $TSource) => TCustomProperties
      label?: GetOptionLabel<$TSource, TCustomProperties>
      selectedLabel?: (source: $TSource, properties: TCustomProperties) => string
      disabled?: (source: $TSource, properties: TCustomProperties) => boolean
      searchableTerm?: (source: $TSource, properties: TCustomProperties) => MaybeArray<string>
    }
  }
): UseFormSelectReturn<TCustomProperties, $TSource, $TValue, TMultiple>

// Overload #2: Source is an object with id and label

export function useFormSelect<
  TBaseSource extends { id: CollectionItemId; label: string },
  TAllowEmpty extends boolean = false,
  TCustomProperties extends CollectionItemProperties = EmptyObject,
  TGetValue extends GetOptionValue<$TSource, TCustomProperties> = undefined,
  TMultiple extends boolean = false,
  $TSource = TAllowEmpty extends true ? TBaseSource | undefined : TBaseSource,
  $TValue = ExtractValue<$TSource, TGetValue>,
>(
  sources: MaybeRefOrGetter<TBaseSource[]>,
  config?: {
    allowEmpty?: MaybeRefOrGetter<TAllowEmpty>
    multiple?: MaybeRefOrGetter<TMultiple>
    model?: Ref<unknown>
    disabled?: MaybeRefOrGetter<boolean>
    selectedLabel?: (count: number, labels: string[]) => string
    placeholder?: MaybeRefOrGetter<string>
    searchPlaceholder?: MaybeRefOrGetter<string>
    loading?: MaybeRefOrGetter<boolean>
    required?: MaybeRefOrGetter<boolean>
    searchable?: MaybeRefOrGetter<boolean>
    option?: {
      id?: GetItemId<TBaseSource>
      value?: TGetValue | ((source: $TSource, properties: TCustomProperties) => $TValue)
      properties?: (source: $TSource) => TCustomProperties
      label?: GetOptionLabel<$TSource, TCustomProperties>
      selectedLabel?: (source: $TSource, properties: TCustomProperties) => string
      disabled?: (source: $TSource, properties: TCustomProperties) => boolean
      searchableTerm?: (source: $TSource, properties: TCustomProperties) => MaybeArray<string>
    }
  }
): UseFormSelectReturn<TCustomProperties, $TSource, $TValue, TMultiple>

// Overload #3: Source is an object with id only

export function useFormSelect<
  TBaseSource extends { id: CollectionItemId },
  TAllowEmpty extends boolean = false,
  TCustomProperties extends CollectionItemProperties = EmptyObject,
  TGetValue extends GetOptionValue<$TSource, TCustomProperties> = undefined,
  TMultiple extends boolean = false,
  $TSource = TAllowEmpty extends true ? TBaseSource | undefined : TBaseSource,
  $TValue = ExtractValue<$TSource, TGetValue>,
>(
  sources: MaybeRefOrGetter<TBaseSource[]>,
  config: {
    allowEmpty?: MaybeRefOrGetter<TAllowEmpty>
    multiple?: MaybeRefOrGetter<TMultiple>
    model?: Ref<unknown>
    disabled?: MaybeRefOrGetter<boolean>
    selectedLabel?: (count: number, labels: string[]) => string
    placeholder?: MaybeRefOrGetter<string>
    searchPlaceholder?: MaybeRefOrGetter<string>
    loading?: MaybeRefOrGetter<boolean>
    required?: MaybeRefOrGetter<boolean>
    searchable?: MaybeRefOrGetter<boolean>
    option: {
      id?: GetItemId<TBaseSource>
      value?: TGetValue | ((source: $TSource, properties: TCustomProperties) => $TValue)
      properties?: (source: $TSource) => TCustomProperties
      label: GetOptionLabel<$TSource, TCustomProperties>
      selectedLabel?: (source: $TSource, properties: TCustomProperties) => string
      disabled?: (source: $TSource, properties: TCustomProperties) => boolean
      searchableTerm?: (source: $TSource, properties: TCustomProperties) => MaybeArray<string>
    }
  }
): UseFormSelectReturn<TCustomProperties, $TSource, $TValue, TMultiple>

// Overload #4: Source is an object with label only

export function useFormSelect<
  TBaseSource extends { label: string },
  TAllowEmpty extends boolean = false,
  TCustomProperties extends CollectionItemProperties = EmptyObject,
  TGetValue extends GetOptionValue<$TSource, TCustomProperties> = undefined,
  TMultiple extends boolean = false,
  $TSource = TAllowEmpty extends true ? TBaseSource | undefined : TBaseSource,
  $TValue = ExtractValue<$TSource, TGetValue>,
>(
  sources: MaybeRefOrGetter<TBaseSource[]>,
  config: {
    allowEmpty?: MaybeRefOrGetter<TAllowEmpty>
    multiple?: MaybeRefOrGetter<TMultiple>
    model?: Ref<unknown>
    disabled?: MaybeRefOrGetter<boolean>
    selectedLabel?: (count: number, labels: string[]) => string
    placeholder?: MaybeRefOrGetter<string>
    searchPlaceholder?: MaybeRefOrGetter<string>
    loading?: MaybeRefOrGetter<boolean>
    required?: MaybeRefOrGetter<boolean>
    searchable?: MaybeRefOrGetter<boolean>
    option: {
      id: GetItemId<TBaseSource>
      value?: TGetValue | ((source: $TSource, properties: TCustomProperties) => $TValue)
      properties?: (source: $TSource) => TCustomProperties
      label?: GetOptionLabel<$TSource, TCustomProperties>
      selectedLabel?: (source: $TSource, properties: TCustomProperties) => string
      disabled?: (source: $TSource, properties: TCustomProperties) => boolean
      searchableTerm?: (source: $TSource, properties: TCustomProperties) => MaybeArray<string>
    }
  }
): UseFormSelectReturn<TCustomProperties, $TSource, $TValue, TMultiple>

// Overload #5: Any other case

export function useFormSelect<
  TBaseSource,
  TAllowEmpty extends boolean = false,
  TCustomProperties extends CollectionItemProperties = EmptyObject,
  TGetValue extends GetOptionValue<$TSource, TCustomProperties> = undefined,
  TMultiple extends boolean = false,
  $TSource = TAllowEmpty extends true ? TBaseSource | undefined : TBaseSource,
  $TValue = ExtractValue<$TSource, TGetValue>,
>(
  sources: MaybeRefOrGetter<TBaseSource[]>,
  config: {
    allowEmpty?: MaybeRefOrGetter<TAllowEmpty>
    multiple?: MaybeRefOrGetter<TMultiple>
    model?: Ref<unknown>
    disabled?: MaybeRefOrGetter<boolean>
    selectedLabel?: (count: number, labels: string[]) => string
    placeholder?: MaybeRefOrGetter<string>
    searchPlaceholder?: MaybeRefOrGetter<string>
    loading?: MaybeRefOrGetter<boolean>
    required?: MaybeRefOrGetter<boolean>
    searchable?: MaybeRefOrGetter<boolean>
    option: {
      id: GetItemId<TBaseSource>
      value?: TGetValue | ((source: $TSource, properties: TCustomProperties) => $TValue)
      properties?: (source: $TSource) => TCustomProperties
      label: GetOptionLabel<$TSource, TCustomProperties>
      selectedLabel?: (source: $TSource, properties: TCustomProperties) => string
      disabled?: (source: $TSource, properties: TCustomProperties) => boolean
      searchableTerm?: (source: $TSource, properties: TCustomProperties) => MaybeArray<string>
    }
  }
): UseFormSelectReturn<TCustomProperties, $TSource, $TValue, TMultiple>

// Implementation

export function useFormSelect<
  TBaseSource,
  TAllowEmpty extends boolean = false,
  TCustomProperties extends CollectionItemProperties = EmptyObject,
  TGetValue extends GetOptionValue<$TSource, TCustomProperties> = undefined,
  TMultiple extends boolean = false,
  $TSource = TAllowEmpty extends true ? TBaseSource | undefined : TBaseSource,
  $TValue = ExtractValue<$TSource, TGetValue>,
>(
  baseSources: MaybeRefOrGetter<TBaseSource[]>,
  config?: {
    allowEmpty?: MaybeRefOrGetter<boolean>
    multiple?: MaybeRefOrGetter<boolean>
    model?: Ref<unknown>
    disabled?: MaybeRefOrGetter<boolean>
    selectedLabel?: (count: number, labels: string[]) => string
    placeholder?: MaybeRefOrGetter<string>
    searchPlaceholder?: MaybeRefOrGetter<string>
    loading?: MaybeRefOrGetter<boolean>
    required?: MaybeRefOrGetter<boolean>
    searchable?: MaybeRefOrGetter<boolean>
    option?: {
      id?: GetItemId<TBaseSource>
      value?: GetOptionValue<$TSource, TCustomProperties>
      properties?: (source: $TSource) => TCustomProperties
      label?: GetOptionLabel<$TSource, TCustomProperties>
      selectedLabel?: (source: $TSource, properties: TCustomProperties) => string
      disabled?: (source: $TSource, properties: TCustomProperties) => boolean
      searchableTerm?: (source: $TSource, properties: TCustomProperties) => MaybeArray<string>
    }
  }
): UseFormSelectReturn<TCustomProperties, $TSource, $TValue, TMultiple> {
  const searchTerm = ref('')

  const normalizedSearchTerm = computed(() => toSearchTerm(searchTerm))

  const isMultiple = computed(() => toValue(config?.multiple) ?? false) as ComputedRef<TMultiple>

  const isDisabled = computed(() => toValue(config?.disabled) ?? false)

  const isLoading = computed(() => toValue(config?.loading) ?? false)

  const isRequired = computed(() => toValue(config?.required) ?? false)

  const placeholder = computed(() => toValue(config?.placeholder) ?? '')

  const searchPlaceholder = computed(() => toValue(config?.searchPlaceholder) ?? '')

  const isSearchable = computed(() => toValue(config?.searchable) ?? false)

  const sources = computed(() =>
    config?.allowEmpty ? [undefined, ...toValue(baseSources)] : toValue(baseSources)
  ) as ComputedRef<$TSource[]>

  const {
    items: allOptions,
    useSubset,
    useFlag,
  } = useCollection(sources, {
    itemId: source =>
      source === undefined ? '__EMPTY_OPTION__' : guessItemId(source as TBaseSource, config?.option?.id),
    flags: {
      active: { multiple: false },
      selected: { multiple: isMultiple },
    },
    properties: (source): FormOptionCollectionItemProperties<TCustomProperties, $TValue> => {
      const customProperties = config?.option?.properties?.(source) ?? ({} as TCustomProperties)
      const label = computed(() => guessLabel(source, customProperties, config?.option?.label))
      const value = computed(() => guessValue(source, customProperties, config?.option?.value) as $TValue)
      const disabled = computed(() => isDisabled.value || config?.option?.disabled?.(source, customProperties) === true)
      const searchableTerm = computed(() => config?.option?.searchableTerm?.(source, customProperties))
      const selectedLabel = computed(() => config?.option?.selectedLabel?.(source, customProperties))

      const searchableTerms = computed(() =>
        toArray(toValue(searchableTerm) ?? toValue(label)).map(term => toSearchTerm(term))
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
            option.toggleFlag('selected', (modelValue as $TValue[]).includes(option.properties.value as $TValue))
          })
        } else {
          allOptions.value.find(option => option.properties.value === modelValue)?.toggleFlag('selected', true)
        }
      },
      { immediate: true }
    )

    watch(
      selectedValues,
      newValues => {
        if (isMultiple.value) {
          model.value = newValues as TMultiple extends true ? $TValue[] : $TValue
        } else {
          model.value = newValues[0] as TMultiple extends true ? $TValue[] : $TValue
        }
      },
      { deep: 1 }
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
  } satisfies FormSelect<TCustomProperties, any> as FormSelect<TCustomProperties, $TSource, $TValue, TMultiple>

  const id = Symbol('useFormSelect ID') as FormSelectId<TCustomProperties, $TSource, $TValue, TMultiple>

  provide(id, select)

  return {
    id,
    ...select,
  } satisfies UseFormSelectReturn<TCustomProperties, $TSource, $TValue, TMultiple>
}
