import { createQueryBuilderGroup } from '@core/packages/query-builder/group/create-query-builder-group.ts'
import { duplicateNode } from '@core/packages/query-builder/node/duplicate-node.ts'
import type { QueryBuilderGroup, QueryBuilderSchema } from '@core/packages/query-builder/types.ts'

export function duplicateGroup(group: QueryBuilderGroup, schema: QueryBuilderSchema): QueryBuilderGroup {
  const newChildren = group.children.map(child => duplicateNode(child, schema))

  return createQueryBuilderGroup({
    operator: group.operator,
    children: newChildren,
    schema,
  })
}
