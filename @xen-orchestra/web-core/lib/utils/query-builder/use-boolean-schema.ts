import type { PropertyDefinition } from '@core/packages/query-builder/types.ts'

export function useBooleanSchema(label: string, values: { true: string; false: string }): PropertyDefinition {
  return {
    label,
    operators: {
      isEmpty: { label: values.false, expectValue: false },
      isNotEmpty: { label: values.true, expectValue: false },
    },
  }
}
