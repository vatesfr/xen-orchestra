import { createQueryBuilderFilter } from '@core/packages/query-builder/filter/create-query-builder-filter'
import { isFilterExpression } from '@core/packages/query-builder/filter/is-filter-expression.ts'
import { handleNode } from '@core/packages/query-builder/node/handle-node'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import type { NumberOrStringNode, StringNode } from 'complex-matcher'
import { parse } from 'complex-matcher'

export function handleStringOrNumberNode({
  property,
  node,
  negate,
  schema,
}: {
  property: string
  node: StringNode | NumberOrStringNode
  negate: boolean
  schema: QueryBuilderSchema
}) {
  // Special case: For "any property" filter (empty property), check if the string value
  // is actually a filter expression (e.g., "boot:firmware:uefi") that should be parsed
  // as a property path query instead of a literal string match
  if (property === '' && isFilterExpression(node.value)) {
    try {
      const parsedExpression = parse(node.value)
      // Recursively handle the parsed expression with appropriate negation
      return handleNode({ node: parsedExpression, negate, schema })
    } catch {
      // If parsing fails, fall back to treating it as a literal string
    }
  }

  // If the value is purely numeric and the property exists in the schema,
  // check if it supports numeric operators (like greaterThan)
  // If so, treat it as 'is' rather than 'contains' to preserve intent
  const isNumericValue = /^\d+$/.test(node.value)
  const propertySchema = schema[property]
  const hasNumericOperators =
    propertySchema && ('greaterThan' in propertySchema.operators || 'lessThan' in propertySchema.operators)

  const shouldUseIsOperator = isNumericValue && hasNumericOperators

  return createQueryBuilderFilter({
    property,
    operator: shouldUseIsOperator ? (negate ? 'isNot' : 'is') : negate ? 'doesNotContain' : 'contains',
    value: node.value,
    schema,
  })
}
