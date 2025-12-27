import { createQueryBuilderFilter } from '@core/packages/query-builder/filter/create-query-builder-filter'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import type { GlobPattern as GlobPatternNode } from 'complex-matcher'

export function handleGlobPatternNode(config: {
  property: string
  node: GlobPatternNode
  negate: boolean
  schema: QueryBuilderSchema
}) {
  return createQueryBuilderFilter({
    property: config.property,
    operator: config.negate ? 'doesNotMatchGlob' : 'matchesGlob',
    value: config.node.value,
    schema: config.schema,
  })
}
