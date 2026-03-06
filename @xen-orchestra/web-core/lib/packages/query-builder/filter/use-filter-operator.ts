import type { OperatorSchema, PropertyOperator, PropertySchema } from '@core/packages/query-builder/types.ts'
import { type ComputedRef, ref, computed } from 'vue'

export function useFilterOperator(propertySchema: ComputedRef<PropertySchema>, initialValue: PropertyOperator) {
  const operator = ref<PropertyOperator>(initialValue)

  const operatorsSchema = computed(() => {
    return propertySchema.value?.operators
  })

  const currentOperatorSchema = computed(() => {
    if (operatorsSchema.value === undefined) {
      return undefined
    }

    return operatorsSchema.value[operator.value]
  })

  const isOperatorValid = computed(() => currentOperatorSchema.value !== undefined)

  const operatorOptions = computed((previousValue: OperatorSchema[] | undefined) => {
    if (operatorsSchema.value !== undefined) {
      return Object.values(operatorsSchema.value)
    }

    return previousValue ?? []
  })

  return {
    operator,
    operatorsSchema,
    currentOperatorSchema,
    isOperatorValid,
    operatorOptions,
  }
}
