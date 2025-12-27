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
  return createQueryBuilderFilter({
    property,
    operator: negate ? 'doesNotContain' : 'contains',
    value: node.value,
    schema,
  })
}
