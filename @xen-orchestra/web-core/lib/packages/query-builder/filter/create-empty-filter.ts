import { createQueryBuilderFilter } from '@core/packages/query-builder/filter/create-query-builder-filter.ts'
import type { QueryBuilderFilter, QueryBuilderSchema } from '@core/packages/query-builder/types.ts'

export function createEmptyFilter(schema: QueryBuilderSchema): QueryBuilderFilter {
  return createQueryBuilderFilter({
    property: '',
    operator: 'contains',
    value: '',
    schema,
  })
}
