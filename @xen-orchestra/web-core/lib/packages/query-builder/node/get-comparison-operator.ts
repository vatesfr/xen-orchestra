import { QueryBuilderError } from '@core/packages/query-builder/query-builder-error.ts'
import type { PropertyOperator } from '@core/packages/query-builder/types.ts'
import type { ComparisonOperator } from 'complex-matcher'

export function getComparisonOperator(operator: ComparisonOperator, negate: boolean): PropertyOperator {
  switch (operator) {
    case '>':
      return negate ? 'lessThanOrEqual' : 'greaterThan'
    case '>=':
      return negate ? 'lessThan' : 'greaterThanOrEqual'
    case '<':
      return negate ? 'greaterThanOrEqual' : 'lessThan'
    case '<=':
      return negate ? 'greaterThan' : 'lessThanOrEqual'
    default:
      throw new QueryBuilderError(`Unhandled comparison operator`, operator)
  }
}
