import { createEmptyFilter } from '@core/packages/query-builder/filter/create-empty-filter.ts'
import { createQueryBuilderGroup } from '@core/packages/query-builder/group/create-query-builder-group.ts'
import type {
  GroupOperator,
  QueryBuilderFilter,
  QueryBuilderGroup,
  QueryBuilderSchema,
} from '@core/packages/query-builder/types.ts'

export function convertFilterToGroup(
  filter: QueryBuilderFilter,
  groupOperator: GroupOperator,
  schema: QueryBuilderSchema
): QueryBuilderGroup {
  return createQueryBuilderGroup({
    operator: groupOperator,
    children: [filter, createEmptyFilter(schema)],
    schema,
  })
}
