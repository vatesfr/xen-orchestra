import { createQueryBuilderFilter } from '@core/packages/query-builder/filter/create-query-builder-filter.ts'
import type { QueryBuilderFilter, QueryBuilderSchema } from '@core/packages/query-builder/types.ts'

export function duplicateFilter(filter: QueryBuilderFilter, schema: QueryBuilderSchema) {
  return createQueryBuilderFilter({
    property: filter.property!,
    operator: filter.operator!,
    value: filter.value,
    schema,
  })
}
