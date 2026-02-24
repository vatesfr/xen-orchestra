import type { OperatorSchema, ValueSchema } from '@core/packages/query-builder/types.ts'
import { type ComputedRef, ref, computed } from 'vue'

export function useFilterValue(operatorSchema: ComputedRef<OperatorSchema | undefined>, initialValue: string) {
  const value = ref<string>(initialValue)

  const valuesSchema = computed(() => {
    return operatorSchema.value?.values
  })

  const currentValueSchema = computed(() => {
    if (valuesSchema.value === undefined) {
      return undefined
    }

    return valuesSchema.value[value.value]
  })

  const isValueValid = computed(() => {
    if (operatorSchema.value?.expectValue === false || valuesSchema.value === undefined) {
      return true
    }

    return currentValueSchema.value !== undefined
  })

  const valueOptions = computed((previousValue: ValueSchema[] | undefined) => {
    if (valuesSchema.value !== undefined) {
      return Object.values(valuesSchema.value)
    }

    return previousValue ?? []
  })

  return {
    value,
    valuesSchema,
    currentValueSchema,
    isValueValid,
    valueOptions,
  }
}
