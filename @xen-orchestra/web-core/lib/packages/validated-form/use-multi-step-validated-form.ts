import type { CollectionItemProperties } from '@core/packages/collection'
import type {
  ExtractValue,
  FormSelectId,
  GetOptionValue,
  UseFormSelectReturn,
} from '@core/packages/form-select/types.ts'
import type { FormValidationConfig } from '@core/packages/form-validation/types.ts'
import type { EmptyObject } from '@core/types/utility.type.ts'
import { computed, reactive, ref, shallowReactive, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import {
  useValidatedForm,
  type FieldMetadata,
  type ModelBinding,
  type UseFormSelectConfig,
} from './use-validated-form.ts'

export type NestedFormData = Record<string, Record<string, unknown>>

type FlatKeys<TData extends NestedFormData> = { [K in keyof TData]: keyof TData[K] & string }[keyof TData]

type FieldValue<TData extends NestedFormData, K extends string> = {
  [S in keyof TData]: K extends keyof TData[S] ? TData[S][K] : never
}[keyof TData]

type StepForms<TData extends NestedFormData> = {
  [K in keyof TData]: ReturnType<typeof useValidatedForm<TData[K]>>
}

export function useMultiStepValidatedForm<
  TData extends NestedFormData,
  TSteps extends { [K in keyof TData]: FormValidationConfig<TData[K]> },
>(data: TData, stepConfigs: TSteps) {
  const stepForms = Object.fromEntries(
    (Object.keys(stepConfigs) as (keyof TData & string)[]).map(stepKey => [
      stepKey,
      useValidatedForm(data[stepKey], stepConfigs[stepKey]),
    ])
  ) as unknown as StepForms<TData>

  const fieldToStep = new Map<FlatKeys<TData>, keyof TData & string>()

  for (const stepKey of Object.keys(data) as (keyof TData & string)[]) {
    for (const fieldKey of Object.keys(data[stepKey]) as FlatKeys<TData>[]) {
      if (fieldToStep.has(fieldKey)) {
        throw new Error(`useMultiStepValidatedForm: field "${fieldKey}" is declared in multiple steps`)
      }

      fieldToStep.set(fieldKey, stepKey)
    }
  }

  const idToStep = new Map<FormSelectId, keyof TData & string>()

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

  async function validateStep(stepName: keyof TSteps & string): Promise<boolean> {
    const isValid = await stepForms[stepName].validate()
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

  function resolveStepFromField<K extends FlatKeys<TData>>(key: K): keyof TData & string {
    const stepKey = fieldToStep.get(key)

    if (stepKey === undefined) {
      throw new Error(`useMultiStepValidatedForm: field "${String(key)}" is not declared in any step`)
    }

    return stepKey
  }

  function useField<K extends FlatKeys<TData>>(key: K): ComputedRef<ModelBinding<FieldValue<TData, K>> & FieldMetadata>
  function useField<K extends FlatKeys<TData>, E extends Record<string, unknown>>(
    key: K,
    extras: () => E
  ): ComputedRef<ModelBinding<FieldValue<TData, K>> & FieldMetadata & E>
  function useField<K extends FlatKeys<TData>, E extends Record<string, unknown>>(key: K, extras?: () => E): unknown {
    const stepKey = resolveStepFromField(key)
    const stepForm = stepForms[stepKey] as StepForms<TData>[keyof TData] & {
      useField: (key: string, extras?: () => Record<string, unknown>) => unknown
    }

    return extras !== undefined ? stepForm.useField(key, extras) : stepForm.useField(key)
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
    const stepKey = resolveStepFromField(key)
    const result = stepForms[stepKey].useFormSelect(key as never, sources, formSelectConfig) as UseFormSelectReturn<
      TCustomProperties,
      TSource,
      $TValue | TEmptyValue,
      TMultiple
    >
    idToStep.set(result.id, stepKey)
    return result
  }

  function useSelect(id: FormSelectId): ComputedRef<{ id: FormSelectId } & FieldMetadata>
  function useSelect<E extends Record<string, unknown>>(
    id: FormSelectId,
    extras: () => E
  ): ComputedRef<{ id: FormSelectId } & FieldMetadata & E>
  function useSelect(id: FormSelectId, key: FlatKeys<TData>): ComputedRef<{ id: FormSelectId } & FieldMetadata>
  function useSelect<E extends Record<string, unknown>>(
    id: FormSelectId,
    key: FlatKeys<TData>,
    extras: () => E
  ): ComputedRef<{ id: FormSelectId } & FieldMetadata & E>
  function useSelect<E extends Record<string, unknown> = Record<string, unknown>>(
    id: FormSelectId,
    keyOrExtras?: FlatKeys<TData> | (() => E),
    extras?: () => E
  ) {
    if (typeof keyOrExtras === 'string') {
      const stepKey = resolveStepFromField(keyOrExtras)
      return stepForms[stepKey].useSelect(id, keyOrExtras as never, extras as never)
    }

    const stepKey = idToStep.get(id)

    if (stepKey === undefined) {
      throw new Error('useSelect: could not resolve step for select id — ensure useFormSelect was called first')
    }

    return stepForms[stepKey].useSelect(id, keyOrExtras as never)
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
