import { createQueryBuilderFilter } from '@core/packages/query-builder/filter/create-query-builder-filter'
import { getComparisonOperator } from '@core/packages/query-builder/node/get-comparison-operator.ts'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import type { Comparison as ComparisonNode } from 'complex-matcher'

export function handleComparisonNode(config: {
  property: string
  node: ComparisonNode
  negate: boolean
  schema: QueryBuilderSchema
}) {
  return createQueryBuilderFilter({
    property: config.property,
    operator: getComparisonOperator(config.node._operator, config.negate),
    value: config.node._value.toString(),
    schema: config.schema,
  })
}
