import { duplicateFilter } from '@core/packages/query-builder/filter/duplicate-filter.ts'
import { duplicateGroup } from '@core/packages/query-builder/group/duplicate-group.ts'
import type { QueryBuilderNode, QueryBuilderSchema } from '@core/packages/query-builder/types.ts'

export function duplicateNode(node: QueryBuilderNode, schema: QueryBuilderSchema): QueryBuilderNode {
  return node.isGroup ? duplicateGroup(node, schema) : duplicateFilter(node, schema)
}
