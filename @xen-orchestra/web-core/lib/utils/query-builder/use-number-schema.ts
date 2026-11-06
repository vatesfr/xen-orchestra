import type { PropertyDefinition } from '@core/packages/query-builder/types.ts'

// No "is empty" / "is not empty": they test truthiness, so 0 would be considered empty
export function useNumberSchema(label: string, values?: Record<string, string>): PropertyDefinition {
  return {
    label,
    operators: {
      greaterThan: { label: '>', values },
      lessThan: { label: '<', values },
      greaterThanOrEqual: { label: '>=', values },
      lessThanOrEqual: { label: '<=', values },
      is: { label: '=', values },
      isNot: { label: '!=', values },
    },
  }
}
