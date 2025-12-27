import { createQueryBuilderFilter } from '@core/packages/query-builder/filter/create-query-builder-filter'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import type { TruthyProperty } from 'complex-matcher'

export function handleTruthyPropertyNode({
  node,
  negate,
  schema,
}: {
  node: TruthyProperty
  negate: boolean
  schema: QueryBuilderSchema
}) {
  return createQueryBuilderFilter({
    property: node.name,
    operator: negate ? 'isEmpty' : 'isNotEmpty',
    value: '',
    schema,
  })
}
