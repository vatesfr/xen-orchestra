import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { CollectionItemProperties, GetItemId } from '@core/packages/collection'
import type {
  ExtractValue,
  FormSelectId,
  GetOptionLabel,
  GetOptionValue,
  UseFormSelectReturn,
} from '@core/packages/form-select/types.ts'
import type { FormValidationConfig } from '@core/packages/form-validation/types.ts'
import type { EmptyObject, MaybeArray } from '@core/types/utility.type.ts'
import { computed, reactive, ref, shallowReactive, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { useValidatedForm } from './use-validated-form.ts'

type ModelBinding<T> = { modelValue: T; 'onUpdate:modelValue': (value: T) => void }

type FieldMetadata = {
  error: InputWrapperMessage | undefined
  warning: InputWrapperMessage | undefined
  onBlur: () => void
}

type UseFormSelectConfig<TSource, TCustomProperties extends CollectionItemProperties> = {
  multiple?: MaybeRefOrGetter<boolean>
  disabled?: MaybeRefOrGetter<boolean>
  selectedLabel?: (count: number, labels: string[]) => string | undefined
  placeholder?: MaybeRefOrGetter<string>
  searchPlaceholder?: MaybeRefOrGetter<string>
  loading?: MaybeRefOrGetter<boolean>
  required?: MaybeRefOrGetter<boolean>
  searchable?: MaybeRefOrGetter<boolean>
  emptyOption?: MaybeRefOrGetter<{
    value: unknown
    properties?: TCustomProperties
    label: string
    selectedLabel?: string
  }>
  option?: {
    id?: GetItemId<TSource>
    value?:
      | GetOptionValue<TSource, TCustomProperties>
      | ((source: TSource, properties: TCustomProperties, index: number) => unknown)
    properties?: (source: TSource) => TCustomProperties
    label?: GetOptionLabel<TSource, TCustomProperties>
    selectedLabel?: (source: TSource, properties: TCustomProperties) => string
    disabled?: (source: TSource, properties: TCustomProperties) => boolean
    searchableTerm?: (source: TSource, properties: TCustomProperties) => MaybeArray<string>
  }
}

export type NestedFormData = Record<string, Record<string, unknown>>

type FlatKeys<TData extends NestedFormData> = { [K in keyof TData]: keyof TData[K] & string }[keyof TData]

type FieldValue<TData extends NestedFormData, K extends string> = {
  [S in keyof TData]: K extends keyof TData[S] ? TData[S][K] : never
}[keyof TData]

export function useMultiStepValidatedForm<
  TData extends NestedFormData,
  TSteps extends { [K in keyof TData]: FormValidationConfig<TData[K]> },
>(data: TData, stepConfigs: TSteps) {
  type AnyStepForm = ReturnType<typeof useValidatedForm<Record<string, unknown>>>

  const stepForms = Object.fromEntries(
    Object.keys(stepConfigs).map(stepKey => [
      stepKey,
      useValidatedForm(
        data[stepKey],
        stepConfigs[stepKey as keyof TSteps] as FormValidationConfig<Record<string, unknown>>
      ),
    ])
  ) as Record<string, AnyStepForm>

  const fieldToStep = new Map<string, string>()

  for (const stepKey of Object.keys(data)) {
    for (const fieldKey of Object.keys(data[stepKey])) {
      fieldToStep.set(fieldKey, stepKey)
    }
  }

  const idToStep = new Map<symbol, string>()

  const stepKeys = Object.keys(stepConfigs) as (keyof TSteps & string)[]
  const currentStepIndex = ref(0)
  const currentStep = computed(() => stepKeys[currentStepIndex.value])

  const stepValidStates = shallowReactive(new Map<keyof TSteps, boolean>())
  const isValidating = ref(false)

  const areAllStepsValid = computed(
    () => stepKeys.length === stepValidStates.size && [...stepValidStates.values()].every(Boolean)
  )

  function isStepValid(stepName: keyof TSteps): boolean | undefined {
    return stepValidStates.get(stepName)
  }

  async function validateStep(stepName: keyof TSteps): Promise<boolean> {
    const isValid = await stepForms[stepName as string].validate()
    stepValidStates.set(stepName, isValid)
    return isValid
  }

  async function validateAllSteps(): Promise<boolean> {
    if (isValidating.value) {
      return false
    }

    isValidating.value = true

    try {
      const results = await Promise.all(stepKeys.map(key => stepForms[key].validate()))
      stepValidStates.clear()
      stepKeys.forEach((key, index) => stepValidStates.set(key, results[index]))
      return results.every(Boolean)
    } finally {
      isValidating.value = false
    }
  }

  async function next(): Promise<boolean> {
    const isValid = await validateStep(stepKeys[currentStepIndex.value])

    if (isValid && currentStepIndex.value < stepKeys.length - 1) {
      currentStepIndex.value++
    }

    return isValid
  }

  function back(): void {
    if (currentStepIndex.value > 0) {
      currentStepIndex.value--
    }
  }

  function useField<K extends FlatKeys<TData>>(key: K): ComputedRef<ModelBinding<FieldValue<TData, K>> & FieldMetadata>
  function useField<K extends FlatKeys<TData>, E extends Record<string, unknown>>(
    key: K,
    extras: () => E
  ): ComputedRef<ModelBinding<FieldValue<TData, K>> & FieldMetadata & E>
  function useField<K extends FlatKeys<TData>, E extends Record<string, unknown>>(key: K, extras?: () => E) {
    return (stepForms[fieldToStep.get(key)!] as any).useField(key, extras)
  }

  function useFormSelect<
    TSource,
    TCustomProperties extends CollectionItemProperties = EmptyObject,
    TGetValue extends GetOptionValue<TSource, TCustomProperties> = undefined,
    TMultiple extends boolean = false,
    TEmptyValue = never,
    $TValue = ExtractValue<TSource, TGetValue>,
  >(
    key: FlatKeys<TData>,
    sources: MaybeRefOrGetter<TSource[]>,
    formSelectConfig?: UseFormSelectConfig<TSource, TCustomProperties>
  ): UseFormSelectReturn<TCustomProperties, TSource, $TValue | TEmptyValue, TMultiple> {
    const stepKey = fieldToStep.get(key)!
    const result = (stepForms[stepKey] as any).useFormSelect(key, sources, formSelectConfig)
    idToStep.set(result.id as unknown as symbol, stepKey)
    return result
  }

  function useSelect(id: FormSelectId): ComputedRef<{ id: FormSelectId } & FieldMetadata>
  function useSelect<E extends Record<string, unknown>>(
    id: FormSelectId,
    extras: () => E
  ): ComputedRef<{ id: FormSelectId } & FieldMetadata & E>
  function useSelect<E extends Record<string, unknown>>(
    id: FormSelectId,
    key: FlatKeys<TData>,
    extras?: () => E
  ): ComputedRef<{ id: FormSelectId } & FieldMetadata & E>
  function useSelect<E extends Record<string, unknown> = Record<string, unknown>>(
    id: FormSelectId,
    keyOrExtras?: FlatKeys<TData> | (() => E),
    extras?: () => E
  ) {
    if (typeof keyOrExtras === 'string') {
      return (stepForms[fieldToStep.get(keyOrExtras)!] as any).useSelect(id, keyOrExtras, extras)
    }

    const stepKey = idToStep.get(id as unknown as symbol)

    if (stepKey !== undefined) {
      return (stepForms[stepKey] as any).useSelect(id, keyOrExtras)
    }

    throw new Error('useSelect: could not resolve step for select id — ensure useFormSelect was called first')
  }

  return {
    useField,
    useFormSelect,
    useSelect,
    currentStep,
    next,
    back,
    isStepValid,
    areAllStepsValid,
    isValidating,
    validateStep,
    validateAllSteps,
  }
}

export function defineFormSteps<T extends NestedFormData>(steps: T): T {
  return reactive(steps) as T
}
