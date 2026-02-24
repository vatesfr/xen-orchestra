import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { ref, computed } from 'vue'

export function useFilterProperty(schema: QueryBuilderSchema, initialValue: string) {
  const property = ref<string>(initialValue)

  const currentPropertySchema = computed(() => schema[property.value])

  const isPropertyValid = computed(() => currentPropertySchema.value !== undefined)

  const propertyOptions = computed(() => Object.values(schema))

  return {
    property,
    isPropertyValid,
    propertyOptions,
    currentPropertySchema,
  }
}
