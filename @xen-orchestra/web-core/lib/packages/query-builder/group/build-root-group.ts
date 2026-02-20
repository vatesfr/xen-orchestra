import { createQueryBuilderGroup } from '@core/packages/query-builder/group/create-query-builder-group'
import type { QueryBuilderNode, QueryBuilderSchema } from '@core/packages/query-builder/types.ts'

export function buildRootGroup(rootNode: QueryBuilderNode, schema: QueryBuilderSchema) {
  try {
    return rootNode.isGroup
      ? rootNode
      : createQueryBuilderGroup({
          operator: 'and',
          children: [rootNode],
          schema,
        })
  } catch {
    return createQueryBuilderGroup({
      operator: 'and',
      children: [],
      schema,
    })
  }
}
