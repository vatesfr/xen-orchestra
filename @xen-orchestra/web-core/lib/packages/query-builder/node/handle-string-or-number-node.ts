import { createQueryBuilderFilter } from '@core/packages/query-builder/filter/create-query-builder-filter'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import type { NumberOrStringNode, StringNode } from 'complex-matcher'

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
